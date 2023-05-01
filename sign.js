import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import SignComponent from './component/SignComponent.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://mozilla.github.io/pdf.js/build/pdf.worker.js";
const Base64Prefix = "data:application/pdf;base64,";

const app = createApp({
    data() {
        return {
            newfile: true,
            files: [],
            pafSigns: [],

            state: '1',
            nowFile: undefined,
            btn: "開啟檔案",

            /////////簽名
            canvasSignWidth: 500,
            canvasSignHeight: 200,
            isPainting: false,
            signColor: "black",
            showImg: '',
            // dragging: false,

        }

    },
    methods: {
        handleDrop(event) {
            event.preventDefault();
            this.pushList(event.dataTransfer.files);

        },
        /////////////////////簽名檔案///////////////////////////////

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


        isCanvasBlank(canvas) {
            var blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            return canvas.toDataURL() == blank.toDataURL();
        },

        saveNewSign() {
            // 圖片儲存的類型選擇 png ，並將值放入 img 的 src
            if (this.isCanvasBlank(this.signCanvas)) {
                Swal.fire({

                    position: 'top-end',
                    icon: 'error',
                    title: '請確實簽名',
                    showConfirmButton: false,
                    timer: 1000,

                  })
                return;
            }
            const newImg = this.signCanvas.toDataURL("image/png");
            this.pafSigns.push(newImg)
            // localStorage.setItem('img', newImg)
            localStorage.setItem('imgs', JSON.stringify(this.pafSigns))

            this.pointSign('resetNewSign')
            this.signmodal.hide()

        },

        pointSign(e, index) {
            if (e == 'creatNewSign') {
                if(this.pafSigns.length >=5){
                    Swal.fire({

                        position: 'top-end',
                        icon: 'warning',
                        title: '簽名最多五個',
                        text: "請先刪除現有簽名！",
                        showConfirmButton: false,
                        timer: 1000,
    
                      })
                    return;
                }
                else{
                    this.signmodal.show()
                }
                
            }
            else if (e == 'resetNewSign') {
                this.ctx.clearRect(0, 0, this.canvasSignWidth, this.canvasSignHeight);
            }
            else if (e == 'saveNewSign') {
                this.saveNewSign()
            }
            else if (e === 'delSign') {
                this.pafSigns.splice(index, 1);
                localStorage.setItem('imgs', JSON.stringify(this.pafSigns));

            }
        },
        getSign() {
            if (localStorage.getItem("imgs")) {
                let sign = localStorage.getItem("imgs");
                this.pafSigns = JSON.parse(sign)
            }

        },
        /////////////////////pdf上傳//////////////////////////////

        async readBlob(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener("load", () => resolve(reader.result));
                reader.addEventListener("error", reject);
                reader.readAsDataURL(blob);
            });
        },

        async openNowPdf(e) {

            this.canvas.requestRenderAll();
            const pdfData = await this.printPDF(e);
            const pdfImage = await this.pdfToImage(pdfData);

            // 透過比例設定 canvas 尺寸
            this.canvas.setWidth(pdfImage.width / window.devicePixelRatio);
            this.canvas.setHeight(pdfImage.height / window.devicePixelRatio);

            // 將 PDF 畫面設定為背景
            this.canvas.setBackgroundImage(pdfImage, this.canvas.renderAll.bind(this.canvas));
        },

        async printPDF(pdfData) {
            const data = atob(pdfData.substring(Base64Prefix.length));
            const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
            const pdfPage = await pdfDoc.getPage(1);

            const viewport = pdfPage.getViewport({ scale: window.devicePixelRatio });
            const canvas = document.createElement("canvas");
            // const canvas = this.$refs.pdfCanvas

            const context = canvas.getContext("2d");


            // 設定 PDF 所要顯示的寬高及渲染
            canvas.height = viewport.height;
            canvas.width = viewport.width;


            const renderContext = {
                canvasContext: context,
                viewport,
            };
            const renderTask = pdfPage.render(renderContext);

            // 回傳做好的 PDF canvas
            return renderTask.promise.then(() => canvas);
        },

        async pdfToImage(pdfData) {
            // 設定 PDF 轉為圖片時的比例
            const scale = 1 / window.devicePixelRatio;

            // 回傳圖片
            return new fabric.Image(pdfData, {
                id: "renderPDF",
                scaleX: scale,
                scaleY: scale,
                onload: function () {
                    canvas.renderAll(); 
                }
            });
        },

        //簽名印在PDF上

        uppdfSign(nowSign) {
            const canvas = this.canvas;
            fabric.Image.fromURL(nowSign, function (image) {
                // 設定簽名出現的位置及大小，後續可調整
                // console.log(image)
                image.top = 400;
                image.scaleX = 0.5;
                image.scaleY = 0.5;
                canvas.add(image);
                canvas.renderAll();

            });
        },

        download() {
            const pdf = new jsPDF();
            const image = canvas.toDataURL("image/png");

            // 設定背景在 PDF 中的位置及大小
            const width = pdf.internal.pageSize.width;
            const height = pdf.internal.pageSize.height;
            pdf.addImage(image, "png", 0, 0, width, height);

            // 將檔案取名並下載
            pdf.save("download.pdf");
        },


        pushList(files) {
            let today = new Date();
            let uploadTime = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}，${today.getHours()}:${(today.getMinutes() < 10) ? `0${today.getMinutes()}` : today.getMinutes()}`;
            let self = this;
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
        
                this.readBlob(file).then(function (base64) {
                    // console.log(base64)
                    let obj = {};
                    obj.name = file.name;
                    obj.uploadtime = uploadTime;
                    // obj.opentime = '---';
                    obj.base64 = base64;
                    self.files.push(obj);
        
                });
            }
        
            setTimeout(() => {
                try {
                    localStorage.setItem('files', JSON.stringify(self.files));
                    Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true,
                        iconColor: "#51A8BC",
                        icon: "success",
                    }).fire({
                        title: '上傳成功',
                    });
                    self.newfile = false;
                } catch (e) {

                    Swal.fire(
                        {
                            title: "檔案超過限制，上傳失敗",
                            icon: "error",
                            confirmButtonText: "我知道了",
                            confirmButtonAriaLabel: "我知道了",
                  
                            // 自訂按鈕 class
                            customClass: {
                              confirmButton: "btn btn-danger",
                            },
                            buttonsStyling: false, // 是否使用sweetalert按鈕樣式（預設為true）
                          }
                    ).then((result) => {
                        window.location.reload();
                    })
                }
            }, 1000);
        
        },

        checknewfile(state) {

            if (state === true) {
                this.newfile = true
            }
            else {
                this.newfile = false

            }
        },
        changeBtn(i) {
            if (i == 'next') {
                if (this.state == '1') {
                    this.state = '2';
                    this.btn = '下載檔案'
                    this.openNowPdf(this.nowFile.base64)
                    // console.log(this.nowFile)
                }
                else if (this.state == '2') {
                    this.state = '3';
                    this.btn = '再次下載'
                    this.download()
                }
                else {
                    this.download()

                }
            }
            else if (i === 'cancel') {
                if (this.state == '2' || this.state == '3') {
          
                    this.canvas.clear();
                    this.state = '1';
                    this.btn = '開啟檔案'
                    this.nowFile = undefined
                }



            }
        },

        getPdf() {

            let storageFiles = localStorage.getItem('files');
            if (storageFiles != null) {
                this.files = JSON.parse(storageFiles);
            }
        },

        //刪除pdf
        pdfClear(index) {
            
            if (index == 'all') {
                localStorage.clear('files')
                this.files = []
            } else {
                this.files.splice(index, 1);
                localStorage.setItem('files', JSON.stringify(this.files));
                this.getPdf()

            }
        },


    },
    mounted() {
        this.signmodal = new bootstrap.Modal(this.$refs.signmodal);

        this.canvas = new fabric.Canvas("canvas");

        this.getPdf()
        this.getSign()

        this.signCanvas = this.$refs.signCanvas;
        this.ctx = this.signCanvas.getContext("2d");
        

    },
});


app.mount('#app')

