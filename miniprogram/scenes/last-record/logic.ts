/**
 * logic.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2024/1/4 14:26:25
 */
import XrFrame from "XrFrame";
const xrSystem = wx.getXrFrameSystem();

interface ILastRecordDemoComponentData {
}

class LastRecordDemoComponent extends xrSystem.Component<ILastRecordDemoComponentData> {
  public schema: XrFrame.IComponentSchema = {
  };

  private _inRealWorld: boolean = true;
  private _placed: boolean = false;
  private _texts: any = {};
  private _textsIndex: any = {};
  private _bgm!: WechatMiniprogram.InnerAudioContext;
  private _records: any;
  private _note: any;
  private _blurTotal!: number;
  private _blurDuration!: number;
  private _startDis!: number;
  private _diff!: XrFrame.Vector2;
  private _doorEventBinded: boolean = false;

  public onAdd() {
    // this._bgm = wx.createInnerAudioContext({});
    // this._bgm.src = 'https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/xr-frame-team/bgm.mp3';
    // this._bgm.loop = true;

    this.scene.getElementById('last-record-assets').event.addOnce('loaded', () => {
      this._records = JSON.parse(this.scene.assets.getAsset('raw', 'records'));
      this._note = this.scene.assets.getAsset('raw', 'note');
    });

    this.scene.event.add('pause', this._handlePause);
    this.scene.event.add('resume', this._handleResume);

    this.scene.physics.enableSimulation = true;
  }

  public onTick(dt: number): void {
    const mainCamEl = this.scene.getElementById('main-camera');
    const mainTrs = mainCamEl.getComponent(xrSystem.Transform);

    this._syncTexts();
    this._checkHit(mainTrs);

    if (!this._placed || !this._inRealWorld) {
      return;
    }

    const door = this.scene.getElementById('door')?.getComponent(xrSystem.Transform);

    if (!door) {
      return;
    } else if (!this._doorEventBinded) {
      this.scene.getElementById('door-mesh').event.addOnce('overlap-begin', this._handleEnterGate);
    }

    const forward = xrSystem.Vector2.createFromArray([door.worldForward.x, door.worldForward.z]);
    const diff = mainTrs.worldPosition.sub(door.worldPosition);
    const diff2 = xrSystem.Vector2.createFromArray([diff.x, diff.z]);
    const preDiff = this._diff || diff2;
    this._diff = diff2;

    const dis = diff.length();
    const preDis = preDiff.length();
    const dir = forward.dot(diff2);
    this._startDis = this._startDis || dis;

    const vignetteAsset = this.scene.assets.getAsset<XrFrame.PostProcess>('post-process', 'vignette');
    const bloomAsset = this.scene.assets.getAsset<XrFrame.PostProcess>('post-process', 'bloom');
    const edgeEnv1 = 0.5;
    const edgeEnv2 = 0.8;
    const edgeDoor1 = 0.3;
    const edgeDoor2 = 0.7;

    if (this._blurDuration) {
      this._blurDuration = Math.max(0, this._blurDuration - dt);
      const p = 1 - this._blurDuration / this._blurTotal;

      // if (p <= edgeEnv1) {
      //   const progress = xrSystem.noneParamsEaseFuncs['ease-in-out'](p / edgeEnv1);
      //   vignetteAsset.data.intensity = progress * 2;
      //   // blurAsset.data.radius = progress * 86 + 10;
      // } else if (p > edgeEnv2) {
      //   const progress = xrSystem.noneParamsEaseFuncs['ease-in-out']((1 - p) / (1 - edgeEnv2));
      //   vignetteAsset.data.intensity = progress * 2;
      //   // blurAsset.data.radius = progress * 96;
      // }
      
      if (p >= edgeDoor1 && p < edgeDoor2) {
        const progress = xrSystem.noneParamsEaseFuncs['ease-in-out']((p - edgeDoor1) / (edgeDoor2 - edgeDoor1));
        door.scale.setValue(progress, 1, 1);
      }
    } else if (this._blurTotal) {
      // let progress = (1 - Math.max(0, Math.min(dis / this._startDis, 0.8)));
      // if (progress >= 0.2) {
      //   progress = (progress - 0.2) / 0.6;
      //   // blurAsset.data.radius = progress * 96;
      //   vignetteAsset.data.intensity = progress * 2;
      //   bloomAsset.data.threshold = 0.5 + progress * 2;
      // }
    }

    //@todo: 等待物理加上碰撞检测，替换
    // if (dir >= 0 || preDis <= 0.2 || dis > 0.2) {
    //   return;
    // }
  }

  public onRemove(parent: XrFrame.Element, data: ILastRecordDemoComponentData): void {
    this._bgm.stop();

    this.scene.physics.enableSimulation = false;
    this.scene.event.remove('pause', this._handlePause);
    this.scene.event.remove('resume', this._handleResume);
  }

  private _handleEnterGate = () => {
    ['sky', 'scene-mesh', 'hikari', 'roam', 'xinyi'].forEach(id => {
      this.scene
        .getElementById(id)
        .getComponent(xrSystem.GLTF).meshes.forEach(mesh => mesh.material.setRenderState('stencilComp', 0));
    });

    this.scene.getElementById('main-camera').getComponent(xrSystem.Camera).setData({
      renderTarget: undefined,
      postProcess: ['tone']
    });

    this.el.event.trigger('set-data', {
      gateClosed: true
    }, false, true);

    this._inRealWorld = false;
  }

  private _checkHit(cameraTrs: XrFrame.Transform) {
    const elements = this.scene.xr.getCurrentSelectedElements();
    if (!elements?.length) {
      return;
    }

    const {el, type, distance, point, actions, xrActions} = elements[0];
    if (type !== xrSystem.EXRInput.Controller) {
      return;
    }

    if (!this._placed) {
      if (el.id === 'ground') {
        const anchor = this.scene.getNodeById('anchor') as XrFrame.Transform;
        if (anchor) {
          anchor.visible = true;
          anchor.position.set(point);
        }

        if (actions['confirm-start']) {
          this._handleShowDoor(point, cameraTrs.rotation);
        }
      }
      return;
    }

    if (el.id === 'note' && actions['confirm-start']) {
      this._handleTouchNote();
      return;
    }

    if (this._records[el.id] && actions['confirm-start']) {
      this._handleTouchObj(el.id, distance);
    }
  }

  private _handlePause = () => {
    if (this._placed) {
      this._bgm.pause();
    }
  }

  private _handleResume = () => {
    if (this._placed) {
      this._bgm.play();
    }
  }

  private _handleShowDoor = (position: XrFrame.Vector3, rotation: XrFrame.Vector3) => {
    const setitem = this.scene.getNodeById('setitem');
    setitem.position.set(position);
    setitem.position.y = 0;
    setitem.rotation.y = rotation.y + Math.PI;
    setitem.visible = true;

    setTimeout(() => {
      this._blurTotal = this._blurDuration = 1700;
    }, 300);

    this._bgm?.play();
    this.el.event.trigger('set-data', {
      placed: true
    }, false, true);
    this._placed = true;
  }

  private _handleTouchNote = () => {
    // this.triggerEvent('showNote', this.note);
  }

  private _handleTouchObj = (id: string, distance: number) => {
    console.log(id, distance)
    // let text = this._texts[id];
    // const {y, d, texts: records} = this._records[id];

    // if (distance > (d || 1.5)) {
    //   return;
    // }

    // if (text) {
    //   clearTimeout(text.timerId);
    // }

    // let index = this._textsIndex[id] === undefined ? -1 : this._textsIndex[id];
    // if (index >= records.length - 1) {
    //   index = 0;
    // } else {
    //   index += 1;
    // }
    // this._textsIndex[id] = index;

    // this._texts[id] = {
    //   content: records[index], y,
    //   timerId: setTimeout(() => {
    //     delete this._texts[id];
    //   }, 4000)
    // };
  }

  private _syncTexts = () => {
    const texts = Object.keys(this._texts).map(id => {
      const {camera, target, content, y} = this._texts[id];
      const xrSystem = wx.getxrSystem();
      const trs = target.getComponent(xrSystem.Transform);
      const tmp = trs.worldPosition.clone();
      tmp.y += y;
      const clipPos = camera.convertWorldPositionToClip(tmp);
      const {frameWidth, frameHeight} = this.scene;

      return {
        content, id,
        x: ((clipPos.x + 1) / 2) * frameWidth,
        y: (1 - (clipPos.y + 1) / 2) * frameHeight
      };
    });
  }
}

xrSystem.registerComponent('last-record-demo', LastRecordDemoComponent);