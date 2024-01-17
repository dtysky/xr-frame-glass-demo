/**
 * effectBG.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2024/1/16 19:16:49
 */
const xrFrameSystem = wx.getXrFrameSystem();

xrFrameSystem.registerEffect('last-record-bg', scene => scene.createEffect({
  name: "last-record-bg",
  properties: [
    {
      key: 'alpha',
      type: xrFrameSystem.EUniformType.FLOAT,
      default: [0]
    },
    {
      key: 'color',
      type: xrFrameSystem.EUniformType.FLOAT3,
      default: [1, 1, 1]
    }
  ],
  images: [
    {
      key: 'u_texture',
      default: 'white'
    }
  ],
  defaultRenderQueue: 2000,
  passes: [{
    "renderStates": {
      cullOn: false,
      blendOn: true,
      depthWrite: false,
      depthTestOn: false
    },
    lightMode: "ForwardBase",
    useMaterialRenderStates: false,
    shaders: [0, 1]
  }],
  shaders: [`
struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn main(attrs: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.Position = correctClipPosition(vec4(attrs.position, 1.));
    output.uv = attrs.texCoord;
    return output;
}
  `,
    `
struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@fragment
fn main(vo: VertexOutput) -> @location(0) vec4<f32> {
  return vec4f(ubMaterial.color, ubMaterial.alpha);
}    
    `],
}));

