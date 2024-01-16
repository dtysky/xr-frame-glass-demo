/**
 * index.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/12/14 16:04:03
 */
import './logic';

Component({
  properties: {},
  data: {
    wrapper: {
      x: 0, y: 0
    },
    perWidth: 1,
    perHeight: 0.5,
    scenes: [
      {
        comp: 'home',
        color: '1 0 0 0.5',
        x: 0, y: 0
      },
      {
        comp: 'animation',
        color: '0 1 0 0.5',
        x: 0, y: 0
      },
      {
        comp: 'instance',
        color: '0 0 1 0.5',
        x: 0, y: 0
      },
      {
        comp: 'last-record',
        color: '0 1 1 0.5',
        x: 0, y: 0
      },
    ]
  },
  lifetimes: {
    attached: function() {
      const count = this.data.scenes.length;
      const totalHeight = count * this.data.perHeight;
      const scenes = this.data.scenes.map((scene, index) => {
        scene.x = 0;
        scene.y = -index * this.data.perHeight;
        return scene;
      });

      this.setData({
        wrapper: {x: 0, y: -totalHeight / 2},
        scenes
      });
    }
  },
  methods: {
    handleChangeScene({detail}) {
      this.triggerEvent('change-scene', detail.value);
    }
  }
})
