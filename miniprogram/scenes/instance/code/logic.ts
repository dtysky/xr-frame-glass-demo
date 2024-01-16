/**
 * logic.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2023/12/26 14:56:57
 */
import XrFrame from 'XrFrame';
const xrFrameSystem = wx.getXrFrameSystem();

interface IInstanceDemoComponentData {
}

class InstanceDemoComponent extends xrFrameSystem.Component<IInstanceDemoComponentData> {
  public schema: XrFrame.IComponentSchema = {
  };

  public onAdd() {
    const material = this.el.getComponent(xrFrameSystem.Mesh).material;
    this._initColors(material);
    this._initTransforms(material);
  }

  private _initColors(material: XrFrame.Material) {
    const {buffer, byteOffsets} = material.getOrCreateExtraBuffer('ubVertexColors', 4 * 4 * 4);
    const array = new Float32Array(new ArrayBuffer(buffer.byteSize));
    array[byteOffsets['colorScale'] / 4] = 2;
    array.set([
      1, 1, 0, 1,
      0, 1, 1, 1,
      1, 0, 1, 1,
      0, 0, 1, 1
    ], byteOffsets['vertexColors'] / 4);
    buffer.update(array.buffer);
  }

  private _initTransforms(material: XrFrame.Material) {
    const {buffer, byteOffsets} = material.getOrCreateExtraBuffer('ubTransforms', 16 * 2 * 4);
    const array = new Float32Array(new ArrayBuffer(buffer.byteSize));
    const position = new xrFrameSystem.Vector3();
    const quat = new xrFrameSystem.Quaternion();
    const scale = xrFrameSystem.Vector3.createFromArray([1, 1, 1]);
    let mat = new xrFrameSystem.Matrix4(array, byteOffsets['localMatrixes'] / 4);
    position.setArray([-2, 0, -2]);
    mat.composeTQS(position, quat, scale);
    mat = new xrFrameSystem.Matrix4(array, byteOffsets['localMatrixes'] / 4 + 16);
    position.setArray([2, 0, 2]);
    mat.composeTQS(position, quat, scale);

    buffer.update(array.buffer);
    material.instanceCount = 2;
  }
}

xrFrameSystem.registerComponent('instance-demo', InstanceDemoComponent);