/**
 * logic.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2023/12/26 14:56:57
 */
const xrFrameSystem = wx.getXrFrameSystem();

interface IExtraPropsDemoComponentData {
}

class ExtraPropsDemoComponent extends xrFrameSystem.Component<IExtraPropsDemoComponentData> {
  public schema: xrFrameSystem.IComponentSchema = {
  };

  public onAdd() {
    const material = this.el.getComponent(xrFrameSystem.Mesh).material;
    this._initColors(material);
    this._initTransforms(material);
  }

  private _initColors(material: xrFrameSystem.Material) {
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

  private _initTransforms(material: xrFrameSystem.Material) {
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

xrFrameSystem.registerComponent('extra-props-demo', ExtraPropsDemoComponent);