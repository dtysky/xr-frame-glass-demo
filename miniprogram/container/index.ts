/**
 * index.ts
 * 
 * @Author  : dtysky(dtysky@outlook.com)
 * @Date    : 2023/12/14 16:04:03
 */
Component({
  properties: {},
  data: {
    // scene: 'last-record',
    scene: 'home',
    showMenu: true
  },
  methods: {
    handleChangeScene({detail}) {
      if (detail === this.data.scene) {
        return;
      }

      console.log('change-scene', detail);
      this.setData({
        scene: detail,
        showMenu: false
      })
    }
  }
})
