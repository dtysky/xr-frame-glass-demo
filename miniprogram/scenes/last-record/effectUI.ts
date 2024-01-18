/**
 * effectUI.ts
 * 
 * @Author  : hikaridai(hikaridai@tencent.com)
 * @Date    : 2024/1/17 12:23:36
 */
const xrFrameSystem = wx.getXrFrameSystem();

xrFrameSystem.registerEffect('last-record-ui', scene => {
  return scene.createEffect({
    name: "last-record-ui",
    properties: [
      {
        key: 'bgColor',
        type: xrFrameSystem.EUniformType.FLOAT4,
        default: [0.2, 0.2, 0.2, 0.6]
      },
      {
        key: 'uvST',
        type: xrFrameSystem.EUniformType.FLOAT4,
        default: [1, 1, 0, 0]
      },
      {
        key: 'projection',
        type: xrFrameSystem.EUniformType.MAT4,
        default: xrFrameSystem.Matrix4.orthographic(
          -1, 1,
          -1 / scene.width * scene.height,
          1 / scene.width * scene.height,
          0.05,
          10
        ).toArray()
      }
    ],
    images: [
      {
        key: 'texture',
        default: 'black'
      }
    ],
    defaultRenderQueue: 4000,
    passes: [{
      "renderStates": {
        blendOn: true,
        cullOn: false,
        depthTestOn: false,
        depthWrite: true,
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
      // output.Position = correctClipPosition(ubMaterial.projection * ubGlobal.view * ubMesh.world * vec4<f32>(attrs.position, 1.));
      // output.Position.z = output.Position.z * -1;
      output.Position = correctClipPosition(ubGlobal.projection * ubGlobal.view * ubMesh.world * vec4<f32>(attrs.position, 1.));
      output.uv = attrs.texCoord_0 * ubMaterial.uvST.xy + ubMaterial.uvST.zw;
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
    let color = textureSample(texture, texture_Sampler, vo.uv);
    if (color.a == 0) {
      return ubMaterial.bgColor;
    }
  
    return vec4f(1, 1, 1, 1);
  }    
      `],
  })
});
