/**
 * logic.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2023/12/29 15:01:03
 */
const xrFrameSystem = wx.getXrFrameSystem();

interface IMenuTmpComponentData {
}

class MenuTmpComponent extends xrFrameSystem.Component<IMenuTmpComponentData> {
  public schema: xrFrameSystem.IComponentSchema = {
  };

  onTick(deltaTime: number, data: IMenuTmpComponentData): void {
    const wrapper = this.scene.getElementById('ui-wrapper').getComponent(xrFrameSystem.Transform);
    const camera = this.scene.render.cameras[0].el.getComponent(xrFrameSystem.Transform);

    wrapper.position.set(camera.position);
    wrapper.quaternion.set(camera.quaternion);

    const elements = this.scene.xr.getCurrentSelectedElements();
  }
}

xrFrameSystem.registerComponent('menu-tmp', MenuTmpComponent);