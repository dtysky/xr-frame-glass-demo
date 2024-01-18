/**
 * effectSuperSimple.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2024/1/17 19:12:12
 */
const vertexOutput =
`
struct VertexOutput {
    @builtin(position) Position: vec4<f32>,

#ifdef WX_ATTR_USE_TEXCOORD_0
    @location(0) uv: vec2<f32>,
#endif
}
`
const xrFrameSystem = wx.getXrFrameSystem();

xrFrameSystem.registerEffect('super-simple', scene => scene.createEffect({
  name: "super-simple",
  properties: [
    { key: 'baseColorFactor', type: xrFrameSystem.EUniformType.FLOAT4, default: [1, 1, 1, 1] },
  ],
  images: [],
  defaultRenderQueue: 2000,
  passes: [{
    "renderStates": {
      cullOn: true,
      blendOn: false,
      depthWrite: true,
    },
    lightMode: "ForwardBase",
    useMaterialRenderStates: true,
    shaders: [0, 1]
  }],
  shaders: [
vertexOutput
+
`
@vertex
fn main(attrs: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  var a_position = attrs.position;

  #ifdef WX_ATTR_USE_TEXCOORD_0
      output.uv = attrs.texCoord_0;
  #endif
  var modelViewMatrix: mat4x4f = ubGlobal.view * ubMesh.world;
  var mvPosition = modelViewMatrix * vec4<f32>(a_position, 1.);
  output.Position = correctClipPosition(ubGlobal.projection * mvPosition);

  return output;
}
`,
// ==== Fragment Shader ====
vertexOutput +
`
@fragment
fn main(vo: VertexOutput) -> @location(0) vec4<f32> {
  return ubMaterial.baseColorFactor;
}
`
  ],
}));
