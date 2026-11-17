/**
 * 2.5D Isometric Engine for Cozy Hangout
 * Provides smooth rendering of outdoor garden and indoor cozy room with avatars.
 */

export class IsoEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Isometric Tile Dimensions
    this.tileW = 64;
    this.tileH = 32;

    // Viewport Camera offset
    this.camX = 0;
    this.camY = 0;
    this.zoom = 1;

    // Active Scene: 'garden' or 'house'
    this.currentScene = 'garden';

    // Map definition (12x12 grid)
    this.mapSize = 12;

    // Local player & remote peers
    this.localPlayer = {
      id: 'local',
      name: 'Kamu',
      x: 5,
      y: 5,
      targetX: 5,
      targetY: 5,
      dir: 'down-right',
      scene: 'garden',
      shirtColor: '#d96b43',
      hairColor: '#4a3b32',
      isMoving: false,
      chatMessage: '',
      chatTimer: 0
    };

    this.remotePlayers = new Map();

    // Callbacks
    this.onPlayerMove = null;
    this.onSceneChange = null;
    this.onInteractObject = null;

    // Setup Canvas Resize
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Setup User Inputs
    this.setupInputs();

    // Start Loop
    this.lastTime = performance.now();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.centerCamera();
  }

  centerCamera() {
    this.camX = this.width / 2;
    this.camY = this.height / 3;
  }

  gridToScreen(gx, gy, elevation = 0) {
    const sx = this.camX + (gx - gy) * (this.tileW / 2);
    const sy = this.camY + (gx + gy) * (this.tileH / 2) - elevation;
    return { x: sx, y: sy };
  }

  screenToGrid(sx, sy) {
    const adjX = sx - this.camX;
    const adjY = sy - this.camY;
    const gx = (adjX / (this.tileW / 2) + adjY / (this.tileH / 2)) / 2;
    const gy = (adjY / (this.tileH / 2) - adjX / (this.tileW / 2)) / 2;
    return { x: Math.round(gx), y: Math.round(gy) };
  }

  setupInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // Do not move if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        dx = -1; dy = -1;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        dx = 1; dy = 1;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        dx = -1; dy = 1;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        dx = 1; dy = -1;
      }

      if (dx !== 0 || dy !== 0) {
        this.moveLocalPlayerRelative(dx, dy);
      }
    });

    // Pointer click to move
    this.canvas.addEventListener('pointerdown', (e) => {
      // Only process left click or touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const target = this.screenToGrid(clickX, clickY);
      this.setLocalPlayerTarget(target.x, target.y);
    });
  }

  moveLocalPlayerRelative(dx, dy) {
    const nextX = Math.max(1, Math.min(this.mapSize - 2, this.localPlayer.x + dx));
    const nextY = Math.max(1, Math.min(this.mapSize - 2, this.localPlayer.y + dy));
    this.setLocalPlayerTarget(nextX, nextY);
  }

  setLocalPlayerTarget(gx, gy) {
    if (gx < 1 || gx >= this.mapSize - 1 || gy < 1 || gy >= this.mapSize - 1) return;
    
    // Check obstacle collision
    if (this.isObstacle(gx, gy)) {
      // Check if it's an interactive object
      this.checkInteraction(gx, gy);
      return;
    }

    this.localPlayer.targetX = gx;
    this.localPlayer.targetY = gy;
    this.localPlayer.isMoving = true;

    // Set direction
    const diffX = gx - this.localPlayer.x;
    const diffY = gy - this.localPlayer.y;
    if (diffX >= 0 && diffY >= 0) this.localPlayer.dir = 'down-right';
    else if (diffX < 0 && diffY >= 0) this.localPlayer.dir = 'down-left';
    else if (diffX >= 0 && diffY < 0) this.localPlayer.dir = 'up-right';
    else this.localPlayer.dir = 'up-left';

    // Broadcast movement to peers
    if (this.onPlayerMove) {
      this.onPlayerMove({
        x: gx,
        y: gy,
        dir: this.localPlayer.dir,
        scene: this.currentScene
      });
    }

    // Check door trigger
    this.checkSceneTriggers(gx, gy);
  }

  isObstacle(gx, gy) {
    if (this.currentScene === 'garden') {
      // Fountain / Pond in the middle
      if (gx >= 5 && gx <= 6 && gy >= 5 && gy <= 6) return true;
      // Front house walls
      if (gy === 1 && gx >= 4 && gx <= 7 && gx !== 5) return true; // gx 5 is door
    } else {
      // Indoor House obstacles
      // Sofa
      if (gx === 4 && gy === 4) return true;
      // Coffee Table
      if (gx === 5 && gy === 4) return true;
      // Boombox shelf
      if (gx === 3 && gy === 2) return true;
    }
    return false;
  }

  checkInteraction(gx, gy) {
    if (this.currentScene === 'house') {
      if (gx === 3 && gy === 2) {
        // Clicked Boombox
        if (this.onInteractObject) this.onInteractObject('boombox');
      }
    }
  }

  checkSceneTriggers(gx, gy) {
    if (this.currentScene === 'garden') {
      // Door into house is at (5, 1)
      if (gx === 5 && gy === 1) {
        this.switchScene('house', 5, 8);
      }
    } else if (this.currentScene === 'house') {
      // Exit mat back to garden is at (5, 9)
      if (gx === 5 && gy === 9) {
        this.switchScene('garden', 5, 2);
      }
    }
  }

  switchScene(sceneName, startX = 5, startY = 5) {
    this.currentScene = sceneName;
    this.localPlayer.scene = sceneName;
    this.localPlayer.x = startX;
    this.localPlayer.y = startY;
    this.localPlayer.targetX = startX;
    this.localPlayer.targetY = startY;
    this.localPlayer.isMoving = false;

    if (this.onSceneChange) {
      this.onSceneChange(sceneName);
    }

    if (this.onPlayerMove) {
      this.onPlayerMove({
        x: startX,
        y: startY,
        dir: this.localPlayer.dir,
        scene: sceneName
      });
    }
  }

  setChatBubble(playerId, text) {
    if (playerId === 'local') {
      this.localPlayer.chatMessage = text;
      this.localPlayer.chatTimer = 5.0; // 5 seconds
    } else if (this.remotePlayers.has(playerId)) {
      const p = this.remotePlayers.get(playerId);
      p.chatMessage = text;
      p.chatTimer = 5.0;
    }
  }

  updatePlayerState(peerId, data) {
    if (!this.remotePlayers.has(peerId)) {
      this.remotePlayers.set(peerId, {
        id: peerId,
        name: data.name || 'Teman',
        x: data.x || 5,
        y: data.y || 5,
        targetX: data.x || 5,
        targetY: data.y || 5,
        dir: data.dir || 'down-left',
        scene: data.scene || 'garden',
        shirtColor: data.shirtColor || '#52796f',
        hairColor: data.hairColor || '#2d2621',
        isMoving: false,
        chatMessage: '',
        chatTimer: 0
      });
    } else {
      const p = this.remotePlayers.get(peerId);
      if (data.x !== undefined) p.targetX = data.x;
      if (data.y !== undefined) p.targetY = data.y;
      if (data.dir) p.dir = data.dir;
      if (data.scene) p.scene = data.scene;
      if (data.name) p.name = data.name;
      if (data.shirtColor) p.shirtColor = data.shirtColor;
      if (data.hairColor) p.hairColor = data.hairColor;
    }
  }

  removeRemotePlayer(peerId) {
    this.remotePlayers.delete(peerId);
  }

  render(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.updateLogic(dt);

    // Clear Canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw Background Sky/Atmosphere
    this.drawAtmosphere();

    // Draw Floor Grid Tiles
    this.drawMapGrid();

    // Collect Renderables for Depth Sorting (Y-Sort)
    const entities = [];

    // Add Scene Static Objects
    this.populateSceneObjects(entities);

    // Add Local Player (if in current scene)
    if (this.localPlayer.scene === this.currentScene) {
      entities.push({
        type: 'player',
        ySort: this.localPlayer.x + this.localPlayer.y,
        data: this.localPlayer
      });
    }

    // Add Remote Players (if in current scene)
    for (const remote of this.remotePlayers.values()) {
      if (remote.scene === this.currentScene) {
        entities.push({
          type: 'player',
          ySort: remote.x + remote.y,
          data: remote
        });
      }
    }

    // Sort by isometric Y coordinate (back to front)
    entities.sort((a, b) => a.ySort - b.ySort);

    // Render sorted entities
    for (const ent of entities) {
      if (ent.type === 'object') {
        ent.render();
      } else if (ent.type === 'player') {
        this.drawAvatar(ent.data);
      }
    }

    requestAnimationFrame(this.render);
  }

  updateLogic(dt) {
    // Update local player position lerp
    this.lerpPlayer(this.localPlayer, dt);

    // Update remote players
    for (const remote of this.remotePlayers.values()) {
      this.lerpPlayer(remote, dt);
    }
  }

  lerpPlayer(p, dt) {
    const speed = 4.5 * dt;
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.05) {
      p.x += (dx / dist) * Math.min(dist, speed);
      p.y += (dy / dist) * Math.min(dist, speed);
      p.isMoving = true;
    } else {
      p.x = p.targetX;
      p.y = p.targetY;
      p.isMoving = false;
    }

    // Chat bubble timer countdown
    if (p.chatTimer > 0) {
      p.chatTimer -= dt;
      if (p.chatTimer <= 0) {
        p.chatMessage = '';
      }
    }
  }

  drawAtmosphere() {
    if (this.currentScene === 'garden') {
      // Soft gentle sky gradient
      const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#d8e8dc');
      grad.addColorStop(1, '#f5efe6');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else {
      // Cozy indoor warm ambient lighting
      const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#f2dfcf');
      grad.addColorStop(1, '#e8cfbc');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawMapGrid() {
    for (let gx = 0; gx < this.mapSize; gx++) {
      for (let gy = 0; gy < this.mapSize; gy++) {
        const { x, y } = this.gridToScreen(gx, gy);

        if (this.currentScene === 'garden') {
          this.drawGardenTile(gx, gy, x, y);
        } else {
          this.drawHouseTile(gx, gy, x, y);
        }
      }
    }
  }

  drawGardenTile(gx, gy, x, y) {
    // Determine tile color
    let topColor = '#739e82'; // Soft lush grass
    let leftColor = '#5e856c';
    let rightColor = '#4a6b56';

    // Stone pathway to house
    if (gx === 5 && gy >= 1 && gy <= 8) {
      topColor = '#d9d0c1';
      leftColor = '#b5ab9b';
      rightColor = '#998f80';
    }
    // Pond area
    else if (gx >= 5 && gx <= 6 && gy >= 5 && gy <= 6) {
      topColor = '#64a6bd';
      leftColor = '#4b889e';
      rightColor = '#3a6f82';
    }

    this.drawIsoDiamond(x, y, this.tileW, this.tileH, topColor, leftColor, rightColor, 6);
  }

  drawHouseTile(gx, gy, x, y) {
    // Parquet polished wood floor
    let topColor = (gx + gy) % 2 === 0 ? '#b88358' : '#ad7950';
    let leftColor = '#8c5e3a';
    let rightColor = '#734c2d';

    // Woven Rug in living room
    if (gx >= 4 && gx <= 7 && gy >= 4 && gy <= 6) {
      topColor = '#e6af83';
      leftColor = '#c79267';
      rightColor = '#ab784e';
    }
    // Welcome exit mat
    else if (gx === 5 && gy === 9) {
      topColor = '#8b5a3e';
    }

    this.drawIsoDiamond(x, y, this.tileW, this.tileH, topColor, leftColor, rightColor, 6);
  }

  drawIsoDiamond(x, y, w, h, topColor, leftColor, rightColor, depth = 6) {
    const hw = w / 2;
    const hh = h / 2;

    // Top face
    this.ctx.fillStyle = topColor;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + hw, y + hh);
    this.ctx.lineTo(x, y + h);
    this.ctx.lineTo(x - hw, y + hh);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    if (depth > 0) {
      // Left edge
      this.ctx.fillStyle = leftColor;
      this.ctx.beginPath();
      this.ctx.moveTo(x - hw, y + hh);
      this.ctx.lineTo(x, y + h);
      this.ctx.lineTo(x, y + h + depth);
      this.ctx.lineTo(x - hw, y + hh + depth);
      this.ctx.closePath();
      this.ctx.fill();

      // Right edge
      this.ctx.fillStyle = rightColor;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + h);
      this.ctx.lineTo(x + hw, y + hh);
      this.ctx.lineTo(x + hw, y + hh + depth);
      this.ctx.lineTo(x, y + h + depth);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  populateSceneObjects(entities) {
    if (this.currentScene === 'garden') {
      // Front House Facade & Door at (5, 0)
      entities.push({
        type: 'object',
        ySort: 5 + 0,
        render: () => {
          const { x, y } = this.gridToScreen(5, 0);
          this.drawGardenHouseFacade(x, y);
        }
      });

      // Flowering trees & bushes
      const trees = [
        { gx: 2, gy: 2, flowerColor: '#f7a8b8' },
        { gx: 9, gy: 2, flowerColor: '#ffcad4' },
        { gx: 2, gy: 8, flowerColor: '#ffbe0b' },
        { gx: 9, gy: 9, flowerColor: '#fb6f92' }
      ];

      for (const t of trees) {
        entities.push({
          type: 'object',
          ySort: t.gx + t.gy,
          render: () => {
            const { x, y } = this.gridToScreen(t.gx, t.gy);
            this.drawBlossomTree(x, y, t.flowerColor);
          }
        });
      }
    } else {
      // Cozy House Interior Furniture
      // Modern 2-Seater Sofa at (4, 4)
      entities.push({
        type: 'object',
        ySort: 4 + 4,
        render: () => {
          const { x, y } = this.gridToScreen(4, 4);
          this.drawSofa(x, y);
        }
      });

      // Coffee Table at (5, 4)
      entities.push({
        type: 'object',
        ySort: 5 + 4,
        render: () => {
          const { x, y } = this.gridToScreen(5, 4);
          this.drawCoffeeTable(x, y);
        }
      });

      // Vintage Boombox & Bookshelf at (3, 2)
      entities.push({
        type: 'object',
        ySort: 3 + 2,
        render: () => {
          const { x, y } = this.gridToScreen(3, 2);
          this.drawBoomboxShelf(x, y);
        }
      });

      // Floor Warm Lamp at (7, 3)
      entities.push({
        type: 'object',
        ySort: 7 + 3,
        render: () => {
          const { x, y } = this.gridToScreen(7, 3);
          this.drawFloorLamp(x, y);
        }
      });
    }
  }

  drawGardenHouseFacade(x, y) {
    // Cozy cottage facade with front door
    this.ctx.save();
    // House Wall
    this.ctx.fillStyle = '#f8f4eb';
    this.ctx.strokeStyle = '#3a322c';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.rect(x - 64, y - 90, 128, 90);
    this.ctx.fill();
    this.ctx.stroke();

    // Terracotta Roof
    this.ctx.fillStyle = '#b85d38';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 76, y - 90);
    this.ctx.lineTo(x, y - 135);
    this.ctx.lineTo(x + 76, y - 90);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Wooden Door (entry hotspot)
    this.ctx.fillStyle = '#6f452d';
    this.ctx.fillRect(x - 18, y - 56, 36, 56);
    this.ctx.strokeRect(x - 18, y - 56, 36, 56);

    // Door knob & label
    this.ctx.fillStyle = '#ffd166';
    this.ctx.beginPath();
    this.ctx.arc(x + 10, y - 28, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#3a322c';
    this.ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🏡 Masuk', x, y - 62);

    this.ctx.restore();
  }

  drawBlossomTree(x, y, flowerColor) {
    this.ctx.save();
    // Tree Trunk
    this.ctx.fillStyle = '#5c4033';
    this.ctx.fillRect(x - 6, y - 32, 12, 32);

    // Tree Foliage
    this.ctx.fillStyle = '#4c7c59';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 48, 26, 0, Math.PI * 2);
    this.ctx.fill();

    // Blooming Flower Petals
    this.ctx.fillStyle = flowerColor;
    const offsets = [
      { ox: -10, oy: -55 },
      { ox: 10, oy: -52 },
      { ox: -2, oy: -40 },
      { ox: 12, oy: -38 },
      { ox: -12, oy: -36 }
    ];
    for (const p of offsets) {
      this.ctx.beginPath();
      this.ctx.arc(x + p.ox, y + p.oy, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawSofa(x, y) {
    this.ctx.save();
    // Warm Sage Velvet Sofa
    this.ctx.fillStyle = '#52796f';
    this.ctx.strokeStyle = '#2f3e46';
    this.ctx.lineWidth = 1.5;

    // Sofa base
    this.ctx.beginPath();
    this.ctx.roundRect(x - 30, y - 24, 60, 24, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // Cushions
    this.ctx.fillStyle = '#84a98c';
    this.ctx.beginPath();
    this.ctx.roundRect(x - 26, y - 18, 24, 16, 4);
    this.ctx.roundRect(x + 2, y - 18, 24, 16, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawCoffeeTable(x, y) {
    this.ctx.save();
    // Round wooden tea table
    this.ctx.fillStyle = '#a2704f';
    this.ctx.strokeStyle = '#4a3324';
    this.ctx.lineWidth = 1.5;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y - 8, 20, 11, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // 2 Tea cups
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(x - 6, y - 9, 3, 0, Math.PI * 2);
    this.ctx.arc(x + 6, y - 7, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawBoomboxShelf(x, y) {
    this.ctx.save();
    // Shelf Stand
    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(x - 22, y - 26, 44, 26);

    // Boombox / Vintage Radio Body
    this.ctx.fillStyle = '#d96b43';
    this.ctx.strokeStyle = '#222222';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(x - 18, y - 44, 36, 18, 3);
    this.ctx.fill();
    this.ctx.stroke();

    // Speakers
    this.ctx.fillStyle = '#222222';
    this.ctx.beginPath();
    this.ctx.arc(x - 9, y - 35, 4, 0, Math.PI * 2);
    this.ctx.arc(x + 9, y - 35, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Glowing Note Tag
    this.ctx.fillStyle = '#ffd166';
    this.ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('📻 YouTube', x, y - 48);

    this.ctx.restore();
  }

  drawFloorLamp(x, y) {
    this.ctx.save();
    // Pole
    this.ctx.strokeStyle = '#3d342d';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, y - 55);
    this.ctx.stroke();

    // Warm Light Bulb & Shade
    this.ctx.fillStyle = '#ffeaa7';
    this.ctx.beginPath();
    this.ctx.moveTo(x - 14, y - 55);
    this.ctx.lineTo(x + 14, y - 55);
    this.ctx.lineTo(x + 10, y - 68);
    this.ctx.lineTo(x - 10, y - 68);
    this.ctx.closePath();
    this.ctx.fill();

    // Ambient glow halo
    const glow = this.ctx.createRadialGradient(x, y - 58, 2, x, y - 58, 42);
    glow.addColorStop(0, 'rgba(255, 234, 167, 0.45)');
    glow.addColorStop(1, 'rgba(255, 234, 167, 0)');
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(x, y - 58, 42, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawAvatar(p) {
    const { x, y } = this.gridToScreen(p.x, p.y);
    const bob = p.isMoving ? Math.sin(performance.now() * 0.015) * 3 : 0;

    this.ctx.save();

    // Shadow under character
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 14, 14, 7, 0, 0, Math.PI * 2);
    this.ctx.fill();

    const charY = y + bob;

    // Body (Shirt)
    this.ctx.fillStyle = p.shirtColor;
    this.ctx.strokeStyle = '#1e1e1e';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(x - 10, charY - 14, 20, 20, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // Head
    this.ctx.fillStyle = '#ffdfba';
    this.ctx.beginPath();
    this.ctx.arc(x, charY - 24, 11, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Hair
    this.ctx.fillStyle = p.hairColor;
    this.ctx.beginPath();
    this.ctx.arc(x, charY - 26, 11, Math.PI, 0, false);
    this.ctx.fill();

    // Eyes
    this.ctx.fillStyle = '#222222';
    const isFacingLeft = p.dir.includes('left');
    const eyeOffset = isFacingLeft ? -3 : 3;
    this.ctx.beginPath();
    this.ctx.arc(x + eyeOffset - 2, charY - 23, 1.5, 0, Math.PI * 2);
    this.ctx.arc(x + eyeOffset + 4, charY - 23, 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Name Tag Badge
    this.ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    const textWidth = this.ctx.measureText(p.name).width;
    const badgeW = textWidth + 14;
    const badgeH = 18;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.beginPath();
    this.ctx.roundRect(x - badgeW / 2, charY - 50, badgeW, badgeH, 9);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.fillStyle = '#2d2621';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(p.name, x, charY - 41);

    // Chat Bubble (if active)
    if (p.chatMessage && p.chatTimer > 0) {
      this.drawChatBubble(x, charY - 60, p.chatMessage);
    }

    this.ctx.restore();
  }

  drawChatBubble(x, y, message) {
    this.ctx.save();
    this.ctx.font = '600 12.5px Plus Jakarta Sans, sans-serif';
    const textWidth = Math.min(220, this.ctx.measureText(message).width);
    const bubbleW = textWidth + 20;
    const bubbleH = 28;

    const bx = x - bubbleW / 2;
    const by = y - bubbleH;

    // Comic speech bubble body
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#2d2621';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(bx, by, bubbleW, bubbleH, 12);
    this.ctx.fill();
    this.ctx.stroke();

    // Tail pointing down to head
    this.ctx.beginPath();
    this.ctx.moveTo(x - 5, by + bubbleH);
    this.ctx.lineTo(x, by + bubbleH + 6);
    this.ctx.lineTo(x + 5, by + bubbleH);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Text inside bubble
    this.ctx.fillStyle = '#2d2621';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(message, x, by + bubbleH / 2);

    this.ctx.restore();
  }
}
