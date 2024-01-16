/**
 * logic.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2023/12/29 15:01:03
 */
import XrFrame from "XrFrame";
const xrFrameSystem = wx.getXrFrameSystem();

interface IMenuTmpComponentData {
}

class MenuTmpComponent extends xrFrameSystem.Component<IMenuTmpComponentData> {
  public schema: xrFrameSystem.IComponentSchema = {
  };

  private _preMesh: XrFrame.Mesh;

  onTick(deltaTime: number, data: IMenuTmpComponentData): void {
    const wrapper = this.scene.getElementById('ui-wrapper').getComponent(xrFrameSystem.Transform);
    const camera = this.scene.render.cameras[0].el.getComponent(xrFrameSystem.Transform);

    wrapper.position.set(camera.position);
    wrapper.quaternion.set(camera.quaternion);

    if (this._preMesh) {
      const preColor = this._preMesh.material.getVector('baseColorFactor') as XrFrame.Vector4;
      preColor.w = 0.5;
      this._preMesh.material.setVector('baseColorFactor', preColor)
    }

    const elements = this.scene.xr.getCurrentSelectedElements();
    if (!elements?.length) {
      return;
    }

    const {el, type, actions, xrActions} = elements[0];
    if (type !== xrFrameSystem.EXRInput.Controller) {
      return;
    }

    if (el.name !== 'menu-item') {
      return;
    }

    const mesh = el.getComponent(xrFrameSystem.Mesh) as XrFrame.Mesh;
    const color = mesh.material.getVector('baseColorFactor') as XrFrame.Vector4;
    color.w = 1;
    mesh.material.setVector('baseColorFactor', color)

    if (actions['confirm-start']) {
      this.el.event.trigger('change-scene', el.id.replace('scene-', ''), false, true);
    }

    this._preMesh = mesh;
  }
}

xrFrameSystem.registerComponent('menu-tmp', MenuTmpComponent);