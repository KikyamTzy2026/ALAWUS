import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ROOMS, WALLS, WORLD_WIDTH, WORLD_HEIGHT } from '../game/mapData.js';
import { TASK_LIST } from '../game/tasks.js';
import { createInputState, getMovementDelta } from '../game/playerMovement.js';
import { resolveMove } from '../game/collision.js';
import { updatePosition } from '../firebase/playerService.js';
import { KILL_RANGE, REPORT_RANGE } from '../game/roles.js';

const TASK_RADIUS = 34;
const SABOTAGE_RADIUS = 40;
const VISION_RADIUS = 190; // how far the local player can see through the shadow

class OfficeScene extends Phaser.Scene {
  constructor() {
    super('OfficeScene');
    this.remoteSprites = {};
    this.boneSprites = {};
    this.playersData = {};
    this.bodiesData = {};
    this.localId = null;
    this.role = 'EMPLOYEE';
    this.alive = true;
    this.taskSprites = {};
    this.completedTasks = {};
    this.lastSync = 0;
    this.onNearTask = () => {};
    this.onNearPlayer = () => {};
    this.onNearSabotage = () => {};
    this.onNearBody = () => {};
    this.onReady = null;
  }

  preload() {}

  createAvatar(x, y, colorHex) {
    const container = this.add.container(x, y);

    const shadow = this.add.ellipse(0, 17, 24, 8, 0x000000, 0.3);

    const legL = this.add.rectangle(-6, 10, 7, 12, 0x1f2937, 1);
    legL.setOrigin(0.5, 0);
    const legR = this.add.rectangle(6, 10, 7, 12, 0x1f2937, 1);
    legR.setOrigin(0.5, 0);

    const body = this.add.ellipse(0, 0, 30, 38, colorHex, 1);
    body.setStrokeStyle(2, 0xffffff, 0.35);

    const goggleBand = this.add.rectangle(0, -8, 34, 11, 0x1f2937, 1);
    const lens = this.add.circle(0, -8, 8, 0xe6ebf5, 1);
    lens.setStrokeStyle(2, 0x1f2937, 1);
    const pupil = this.add.circle(2, -7, 3.2, 0x111827, 1);

    container.add([shadow, legL, legR, body, goggleBand, lens, pupil]);
    container.legL = legL;
    container.legR = legR;
    container.body = body;
    container.walkPhase = 0;
    container.prevX = x;
    container.prevY = y;

    return container;
  }

  // Original stylized remains marker - two crossed bones with a small
  // colored badge identifying the victim. Deliberately not a copy of the
  // Among Us corpse asset.
  createBone(x, y, colorHex) {
    const container = this.add.container(x, y);

    const ground = this.add.ellipse(0, 6, 30, 10, 0x000000, 0.28);

    const boneStyle = { fill: 0xe9edf5, stroke: 0x1f2937 };
    const bone1 = this.add.rectangle(0, 0, 26, 6, boneStyle.fill, 1);
    bone1.setStrokeStyle(1.5, boneStyle.stroke, 1);
    bone1.setAngle(35);
    const bone2 = this.add.rectangle(0, 0, 26, 6, boneStyle.fill, 1);
    bone2.setStrokeStyle(1.5, boneStyle.stroke, 1);
    bone2.setAngle(-35);
    const knobs = [
      [-11, -6], [11, -6], [-11, 6], [11, 6]
    ];
    const knobCircles = knobs.map(([kx, ky]) => {
      const c = this.add.circle(kx, ky, 3.6, boneStyle.fill, 1);
      c.setStrokeStyle(1.2, boneStyle.stroke, 1);
      return c;
    });

    const badge = this.add.circle(0, -20, 7, colorHex, 1);
    badge.setStrokeStyle(2, 0xffffff, 0.6);

    container.add([ground, bone1, bone2, ...knobCircles, badge]);
    this.tweens.add({
      targets: container,
      alpha: { from: 0, to: 1 },
      duration: 220
    });
    return container;
  }

  setAvatarWalking(container, isMoving, delta) {
    if (isMoving) {
      container.walkPhase += delta * 0.018;
      const swing = Math.sin(container.walkPhase) * 0.55;
      container.legL.rotation = swing;
      container.legR.rotation = -swing;
      container.body.setScale(1, 1 + Math.abs(Math.sin(container.walkPhase)) * 0.03);
    } else {
      container.legL.rotation = Phaser.Math.Linear(container.legL.rotation, 0, 0.2);
      container.legR.rotation = Phaser.Math.Linear(container.legR.rotation, 0, 0.2);
      container.body.setScale(1, 1);
    }
  }

  create() {
    // room backgrounds
    ROOMS.forEach((room) => {
      const g = this.add.rectangle(room.x + room.w / 2, room.y + room.h / 2, room.w, room.h, room.color, 1);
      g.setStrokeStyle(2, 0x3b82f6, 0.25);
      const label = this.add.text(room.x + 10, room.y + 8, room.name.toUpperCase(), {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#8b98b3'
      });
      label.setAlpha(0.8);
    });

    // walls
    WALLS.forEach((w) => {
      this.add.rectangle(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h, 0x0a0f19, 1).setStrokeStyle(1, 0x1a2233);
    });

    // task hotspots
    TASK_LIST.forEach((task) => {
      const dot = this.add.circle(task.x, task.y, 10, 0xf59e0b, 0.85);
      dot.setStrokeStyle(2, 0xffffff, 0.4);
      this.tweens.add({
        targets: dot,
        alpha: { from: 0.5, to: 1 },
        duration: 900,
        yoyo: true,
        repeat: -1
      });
      const label = this.add.text(task.x, task.y - 22, task.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        color: '#f59e0b'
      });
      label.setOrigin(0.5, 0.5);
      this.taskSprites[task.id] = { dot, label };
    });

    this.keys = createInputState(this);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#05070d');

    this.setupShadow();

    // Signal readiness to React only after everything above exists —
    // this is the single source of truth for "safe to call scene methods".
    if (typeof this.onReady === 'function') {
      this.onReady();
    }
  }

  // Soft dark shadow / limited vision: a full-screen dark render texture
  // with a soft radial hole punched out around the local player each
  // frame. Purely a local rendering effect - never synced through
  // Firebase, and each player's vision is computed independently.
  setupShadow() {
    const cam = this.cameras.main;
    const size = VISION_RADIUS * 2;

    if (!this.textures.exists('visionMask')) {
      const canvasTex = this.textures.createCanvas('visionMask', size, size);
      const ctx = canvasTex.getContext();
      const grad = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.55, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      canvasTex.refresh();
    }

    this.shadowRT = this.add.renderTexture(0, 0, cam.width, cam.height);
    this.shadowRT.setOrigin(0, 0);
    this.shadowRT.setScrollFactor(0);
    this.shadowRT.setDepth(1000);
    this.visionSize = size;
  }

  updateShadow() {
    if (!this.shadowRT) return;
    const cam = this.cameras.main;
    this.shadowRT.clear();
    this.shadowRT.fill(0x03050a, 1);

    if (!this.alive) {
      // dead players (spectators) see everything normally
      this.shadowRT.setVisible(false);
      return;
    }
    this.shadowRT.setVisible(true);

    const me = this.playersData[this.localId];
    if (!me) return;
    const screenX = (me.x - cam.scrollX) * cam.zoom;
    const screenY = (me.y - cam.scrollY) * cam.zoom;
    this.shadowRT.erase('visionMask', screenX - this.visionSize / 2, screenY - this.visionSize / 2);
  }

  setLocalPlayer(id, role, alive) {
    this.localId = id;
    this.role = role;
    this.alive = alive;
  }

  setCallbacks({ onNearTask, onNearPlayer, onNearSabotage, onNearBody }) {
    if (onNearTask) this.onNearTask = onNearTask;
    if (onNearPlayer) this.onNearPlayer = onNearPlayer;
    if (onNearSabotage) this.onNearSabotage = onNearSabotage;
    if (onNearBody) this.onNearBody = onNearBody;
  }

  setCompletedTasks(tasks) {
    this.completedTasks = tasks || {};
    Object.entries(this.taskSprites).forEach(([id, sprite]) => {
      const done = this.completedTasks[id]?.completed;
      sprite.dot.setFillStyle(done ? 0x22c55e : 0xf59e0b, 0.85);
    });
  }

  syncPlayers(players) {
    this.playersData = players || {};
    const seen = new Set();

    Object.entries(this.playersData).forEach(([id, p]) => {
      seen.add(id);
      if (!this.remoteSprites[id]) {
        const color = p.color?.hex ? Phaser.Display.Color.HexStringToColor(p.color.hex).color : 0x3b82f6;
        const avatar = this.createAvatar(p.x, p.y, color);
        const label = this.add.text(p.x, p.y - 34, p.username, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: '#e6ebf5'
        });
        label.setOrigin(0.5, 0.5);
        this.remoteSprites[id] = { avatar, label };

        if (id === this.localId) {
          this.cameras.main.startFollow(avatar, true, 0.15, 0.15);
        }
      }

      // don't imperatively move the local player's own sprite from remote data
      // (local movement is authoritative on this client) but do sync others
      if (id !== this.localId) {
        const sprite = this.remoteSprites[id];
        sprite.avatar.setPosition(p.x, p.y);
        sprite.label.setPosition(p.x, p.y - 34);
        sprite.avatar.setAlpha(p.alive === false ? 0.25 : 1);
        sprite.label.setAlpha(p.alive === false ? 0.4 : 1);
      }
    });

    Object.keys(this.remoteSprites).forEach((id) => {
      if (!seen.has(id)) {
        this.remoteSprites[id].avatar.destroy();
        this.remoteSprites[id].label.destroy();
        delete this.remoteSprites[id];
      }
    });
  }

  syncBodies(bodies) {
    this.bodiesData = bodies || {};
    const seen = new Set();

    Object.entries(this.bodiesData).forEach(([id, b]) => {
      seen.add(id);
      if (!this.boneSprites[id]) {
        const color = b.victimColor?.hex
          ? Phaser.Display.Color.HexStringToColor(b.victimColor.hex).color
          : 0xe9edf5;
        this.boneSprites[id] = this.createBone(b.x, b.y, color);
      }
    });

    Object.keys(this.boneSprites).forEach((id) => {
      if (!seen.has(id)) {
        this.boneSprites[id].destroy();
        delete this.boneSprites[id];
      }
    });
  }

  update(time, delta) {
    // animate every visible player's walk cycle based on real frame-to-frame movement
    Object.entries(this.remoteSprites).forEach(([id, sprite]) => {
      const avatar = sprite.avatar;
      const moved = Phaser.Math.Distance.Between(avatar.prevX, avatar.prevY, avatar.x, avatar.y) > 0.15;
      this.setAvatarWalking(avatar, moved, delta);
      avatar.prevX = avatar.x;
      avatar.prevY = avatar.y;
    });

    if (!this.localId || !this.playersData[this.localId] || !this.alive) {
      this.updateShadow();
      return;
    }

    const localSprite = this.remoteSprites[this.localId];
    if (!localSprite) return;

    const { dx, dy } = getMovementDelta(this.keys);
    if (dx !== 0 || dy !== 0) {
      const current = this.playersData[this.localId];
      const { x, y } = resolveMove(current.x, current.y, dx, dy);
      current.x = x;
      current.y = y;
      localSprite.avatar.setPosition(x, y);
      localSprite.label.setPosition(x, y - 34);

      if (time - this.lastSync > 60) {
        this.lastSync = time;
        updatePosition(this._roomId, this.localId, x, y);
      }
    }

    // proximity checks
    const me = this.playersData[this.localId];
    let nearestTask = null;
    let nearestTaskDist = Infinity;
    TASK_LIST.forEach((task) => {
      if (this.completedTasks[task.id]?.completed) return;
      const dist = Phaser.Math.Distance.Between(me.x, me.y, task.x, task.y);
      if (dist < TASK_RADIUS && dist < nearestTaskDist) {
        nearestTaskDist = dist;
        nearestTask = task;
      }
    });
    this.onNearTask(nearestTask);

    if (this.role === 'SABOTEUR') {
      let nearestPlayer = null;
      let nearestDist = Infinity;
      Object.entries(this.playersData).forEach(([id, p]) => {
        if (id === this.localId || p.alive === false) return;
        const dist = Phaser.Math.Distance.Between(me.x, me.y, p.x, p.y);
        if (dist < KILL_RANGE && dist < nearestDist) {
          nearestDist = dist;
          nearestPlayer = { id, ...p };
        }
      });
      this.onNearPlayer(nearestPlayer);
    }

    // nearest unreported body within report range
    let nearestBody = null;
    let nearestBodyDist = Infinity;
    Object.entries(this.bodiesData).forEach(([id, b]) => {
      if (b.reported) return;
      const dist = Phaser.Math.Distance.Between(me.x, me.y, b.x, b.y);
      if (dist < REPORT_RANGE && dist < nearestBodyDist) {
        nearestBodyDist = dist;
        nearestBody = { id, ...b };
      }
    });
    this.onNearBody(nearestBody);

    this.updateShadow();
  }
}

export default function Map({ roomId, players, playerId, role, alive, tasks, bodies, onNearTask, onNearPlayer, onNearBody }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (gameRef.current) return undefined;

    const scene = new OfficeScene();
    scene.onReady = () => setReady(true);
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: Math.min(WORLD_WIDTH, window.innerWidth),
      height: Math.min(WORLD_HEIGHT, window.innerHeight - 40),
      backgroundColor: '#05070d',
      scene,
      physics: { default: 'arcade' },
      render: { antialias: true }
    });
    scene._roomId = roomId;
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && sceneRef.current) {
      sceneRef.current.setLocalPlayer(playerId, role, alive);
    }
  }, [ready, playerId, role, alive]);

  useEffect(() => {
    if (ready && sceneRef.current) {
      sceneRef.current.setCallbacks({ onNearTask, onNearPlayer, onNearBody });
    }
  }, [ready, onNearTask, onNearPlayer, onNearBody]);

  useEffect(() => {
    if (ready && sceneRef.current) {
      sceneRef.current.syncPlayers(players);
    }
  }, [ready, players]);

  useEffect(() => {
    if (ready && sceneRef.current) {
      sceneRef.current.syncBodies(bodies);
    }
  }, [ready, bodies]);

  useEffect(() => {
    if (ready && sceneRef.current) {
      sceneRef.current.setCompletedTasks(tasks);
    }
  }, [ready, tasks]);

  return <div ref={containerRef} style={{ borderRadius: 12, overflow: 'hidden', lineHeight: 0 }} />;
}
