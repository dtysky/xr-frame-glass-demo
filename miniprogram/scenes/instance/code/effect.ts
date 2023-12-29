/**
 * effect.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2023/12/26 14:53:23
 */
const xrFrameSystem = wx.getXrFrameSystem();

xrFrameSystem.registerEffect('extra-props-demo', scene => scene.createEffect({
  name: 'extra-props-demo',
  properties: [],
  images: [
    {
      key: 'baseColorMap',
      default: 'white'
    }
  ],
  extraProperties: [
    {
      name: 'ubVertexColors',
      properties: [
        {
          key: 'colorScale',
          type: xrFrameSystem.EUniformType.FLOAT,
        },
        {
          key: 'vertexColors',
          type: xrFrameSystem.EUniformType.FLOAT4,
          num: Infinity
        },
      ]
    },
    {
      name: 'ubTransforms',
      properties: [
        {
          key: 'localMatrixes',
          type: xrFrameSystem.EUniformType.MAT4,
          num: Infinity
        }
      ]
    }
  ],
  defaultRenderQueue: 2000,
  passes: [{
    renderStates: {
      cullOn: false,
      blendOn: false,
      depthWrite: true,
      depthTestOn: true
    },
    lightMode: "ForwardBase",
    useMaterialRenderStates: false,
    shaders: [0, 1]
  }],
  shaders: [`
struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
}

@vertex
fn main(
  @builtin(vertex_index) my_index: u32,
#ifdef WX_USE_INSTANCE
  @builtin(instance_index) my_inst_index: u32,
#endif
  attrs: VertexInput
) -> VertexOutput {
  var output: VertexOutput;

#ifdef WX_USE_INSTANCE
  output.Position = ubGlobal.projection * ubGlobal.view * ubMesh.world * ubTransforms.localMatrixes[my_inst_index] * vec4<f32>(attrs.position, 1.);
#else
  output.Position = ubGlobal.projection * ubGlobal.view * ubMesh.world * vec4<f32>(attrs.position, 1.);
#endif
  output.uv = attrs.texCoord_0;
  output.color = ubVertexColors.colorScale * ubVertexColors.vertexColors[my_index];

  return output;
}
  `,
    `
struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
}

@fragment
fn main(vo: VertexOutput) -> @location(0) vec4<f32> {
  var color = vo.color * textureSample(baseColorMap, baseColorMap_Sampler, vo.uv);

  return color;
}
    `],
}));
