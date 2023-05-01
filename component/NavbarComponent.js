
export default {
  data() {
    return {
      canvasSignWidth: 300,
      canvasSignHeight: 200,
      isPainting: false,
      signColor: "black",
      showImg: ''
    }
  },
  methods: {
    getPaintPosition(e) {
      let rect = this.$refs.signCanvas.getBoundingClientRect();

      if (e.type === "touchmove" || e.type === "touchend") {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      } else {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    },
    startPosition(e) {
      if (e) e.preventDefault();
      this.isPainting = true;
      this.ctx.strokeStyle = this.signColor;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = "round";
      this.ctx.beginPath();
    },
    finishedPosition() {
      this.isPainting = false;
    },
    draw(e) {
      if (e) e.preventDefault();
      if (!this.isPainting) return;

      // 取得滑鼠 / 手指位置
      const paintPosition = this.getPaintPosition(e);

      // 移動到滑鼠位置並產生圖案
      this.ctx.lineTo(paintPosition.x, paintPosition.y);
      this.ctx.stroke();
    },

    reset() {

      this.ctx.clearRect(0, 0, this.canvasSignWidth, this.canvasSignHeight);
    },

    saveImage() {
      // 圖片儲存的類型選擇 png ，並將值放入 img 的 src
      const newImg = this.signCanvas.toDataURL("image/png");
      this.showImg = newImg;
      localStorage.setItem('img', newImg)
      console.log(this.showImg)
      console.log(newImg)


    }

  },

  mounted() {
    this.signCanvas = this.$refs.signCanvas;
    this.ctx = this.signCanvas.getContext("2d");



  },
  template: `
      <div class=" mt-4">
      <div class="">
          <div class="title">在框格內簽名</div>
          <canvas style="border: 1px solid black" :width="canvasSignWidth"
                  :height="canvasSignHeight"
                  class="sign-canvas" 
                  id="signCanvas"
                  ref="signCanvas" 
                
                  @mousedown="startPosition"
@mouseup="finishedPosition"
@mouseleave="finishedPosition"
@mousemove="draw"
@touchstart="startPosition"
@touchend="finishedPosition"
@touchcancel="finishedPosition"
@touchmove="draw">
          </canvas>
      </div>
      <div >
          <div>
              <button @click="reset">清除</button>
           
          </div>
          <div >
              <!-- <div class="main-btn main-btn-light" @click="cancelSign">取消</div> -->
              <button  @click="saveImage">簽好了</button>
          </div>
      </div>
  </div>

  <img class="show-img" :src="showImg" width="300" height="200" style="border: 1px solid" />

 `,

}