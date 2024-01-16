import './logic';

const info = wx.getSystemInfoSync();
const dpi = info.pixelRatio;
const width = info.windowWidth * dpi;
const height = info.windowHeight * dpi;

Component({
  properties: {},
  data: {
    width: width,
    height: height,
    loaded: false,
    arReady: false,
    placed: false,
    gateClosed: false
  },
  lifetimes: {},
  methods: {
    handleAssetsProgress: function ({detail}) {
      console.log('assets progress', detail.value);
    },
    handleAssetsLoaded: function ({detail}) {
      console.log('assets loaded', detail.value);
      this.setData({loaded: true});
    },
    handleSetData: function({detail}) {
      console.log('this.setData', detail.value)
      this.setData(detail.value);
    }
  }
})
