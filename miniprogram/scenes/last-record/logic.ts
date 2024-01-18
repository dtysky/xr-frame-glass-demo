/**
 * logic.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2024/1/4 14:26:25
 */
import XrFrame from "XrFrame";
const xrSystem = wx.getXrFrameSystem();

const UP = xrSystem.Vector3.createFromArray([0, 1, 0]);

interface ILastRecordDemoComponentData {
}

class LastRecordDemoComponent extends xrSystem.Component<ILastRecordDemoComponentData> {
  public schema: XrFrame.IComponentSchema = {
  };

  private _inRealWorld: boolean = true;
  private _placed: boolean = false;
  private _texts: {[id: string]: {obj: XrFrame.Element, timerId: number}} = {};
  private _textsIndex: any = {};
  private _bgm!: WechatMiniprogram.InnerAudioContext;
  private _records!: {[name: string]: {y: number, d?: number, frames: string[]}};
  private _atlas!: XrFrame.Atlas;
  private _note: any;
  private _blurTotal!: number;
  private _blurDuration!: number;
  private _startDis!: number;
  private _doorEventBinded: boolean = false;

  public onAdd() {
    // this._bgm = wx.createInnerAudioContext({});
    // this._bgm.src = 'https://mmbizwxaminiprogram-1258344707.cos.ap-guangzhou.myqcloud.com/xr-frame/demo/xr-frame-team/bgm.mp3';
    // this._bgm.loop = true;

    this.scene.getElementById('last-record-assets').event.addOnce('loaded', () => {
      this._records = JSON.parse(this.scene.assets.getAsset('raw', 'records'));
      this._atlas = this.scene.assets.getAsset<XrFrame.Atlas>('atlas', 'records-atlas');
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

    const diff = mainTrs.worldPosition.sub(door.worldPosition);
    const dis = diff.length();
    this._startDis = this._startDis || dis;

    const bgMat = this.scene.getElementById('bg').getComponent(xrSystem.Mesh).material;
    const edgeEnv1 = 0.4;
    const edgeEnv2 = 0.7;
    const edgeDoor1 = 0.3;
    const edgeDoor2 = 0.7;

    if (this._blurDuration) {
      this._blurDuration = Math.max(0, this._blurDuration - dt);
      const p = 1 - this._blurDuration / this._blurTotal;

      if (p <= edgeEnv1) {
        const progress = xrSystem.noneParamsEaseFuncs['ease-in-out'](p / edgeEnv1);
        bgMat.setFloat('alpha', progress * 0.8);
      } else if (p > edgeEnv2) {
        const progress = xrSystem.noneParamsEaseFuncs['ease-in-out']((1 - p) / (1 - edgeEnv2));
        bgMat.setFloat('alpha', Math.max(progress * 0.8, 0.2));
      }
      
      if (p >= edgeDoor1 && p < edgeDoor2) {
        const progress = xrSystem.noneParamsEaseFuncs['ease-in-out']((p - edgeDoor1) / (edgeDoor2 - edgeDoor1));
        door.scale.setValue(progress, 1, 1);
      }
    } else if (this._blurTotal) {
      let progress = Math.min(Math.max(1 - dis / this._startDis, 0) + 0.2, 0.9);
      bgMat.setFloat('alpha', progress);
    }
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
        .getComponent(xrSystem.GLTF).meshes.forEach(mesh => mesh.material.setRenderState('stencilTestOn', false));
    });

    // this.scene.getElementById('main-camera').getComponent(xrSystem.Camera).setData({
    //   postProcess: ['tone']
    // });

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
      this._handleTouchObj(el, distance);
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
    this.scene.getNodeById('anchor').visible = false;

    const setitem = this.scene.getNodeById('setitem');
    setitem.position.set(position);
    setitem.position.y = 0;
    setitem.rotation.y = rotation.y + Math.PI;

    this.scene.event.addOnce('tick', () => {
      this.scene.getNodeById('setitem').visible = true;
      this._bgm?.play();
      this.el.event.trigger('set-data', {
        placed: true
      }, false, true);

      setTimeout(() => {
        this._blurTotal = this._blurDuration = 1700;
      }, 1000);
    }, 100);

    this._placed = true;
  }

  private _handleTouchNote = () => {
    // this.triggerEvent('showNote', this.note);
  }

  private _handleTouchObj = (target: XrFrame.Element, distance: number) => {
    const id: number = (target as any).id;
    let text = this._texts[id];;
    const {y, d, frames} = this._records[id];

    if (distance > (d || 1.5)) {
      return;
    }

    if (text) {
      this.scene.rootShadow.removeChild(text.obj);
      clearTimeout(text.timerId);
    }

    let index = this._textsIndex[id] === undefined ? -1 : this._textsIndex[id];
    if (index >= frames.length - 1) {
      index = 0;
    } else {
      index += 1;
    }
    this._textsIndex[id] = index;

    const trs = target.getComponent(xrSystem.Transform);
    const obj = this.scene.createElement(xrSystem.XRNode);
    this.scene.rootShadow.addChild(obj);
    const meshNode = this.scene.createElement(xrSystem.XRNode, {
      rotation: '90 180 0'
    });
    obj.addChild(meshNode);
    const material = this.scene.createMaterial(this.scene.assets.getAsset<XrFrame.Effect>('effect', 'last-record-ui'));
    meshNode.addComponent(xrSystem.Mesh, {material, geometry: this.scene.assets.getAsset<XrFrame.Geometry>('geometry', 'plane')});
    const meshTrs = meshNode.getComponent(xrSystem.Transform);

    const {w, h} = this._atlas.getFrame(frames[index]);
    meshTrs.scale.x = 0.8 / 448 * w;
    meshTrs.scale.z = meshTrs.scale.x / w * h;
    material.setTexture('texture', this._atlas.texture);
    material.setVector('uvST', this._atlas.getUVST(frames[index]));
  
    const objTrs = obj.getComponent(xrSystem.Transform);
    objTrs.position.set(trs.worldPosition);
    objTrs.position.y += y + 0.1;
    objTrs.visible = false;

    this._texts[id] = {
      obj,
      timerId: setTimeout(() => {
        this.scene.rootShadow.removeChild(obj);
        delete this._texts[id];
      }, 4000)
    };
  }

  private _syncTexts = () => {
    const mainCamEl = this.scene.getElementById('main-camera');
    const mainTrs = mainCamEl.getComponent(xrSystem.Transform);

    for (const id in this._texts) {
      const {obj} = this._texts[id];
      const trs = obj.getComponent(xrSystem.Transform);
      trs.quaternion.lookAt(trs.position, mainTrs.position, UP);
      // mainTrs.quaternion.invert(trs.quaternion);
      // trs.rotation.y = mainTrs.rotation.y + Math.PI;
      trs.visible = true;
    }
  }
}

xrSystem.registerComponent('last-record-demo', LastRecordDemoComponent);