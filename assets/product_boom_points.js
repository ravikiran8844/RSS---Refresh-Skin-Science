(function(global){
    //判断是否是产品页面，若不是直接退出
    if(ShopifyAnalytics.meta.page.pageType != "product") {
        return
    }
    function Points() {
        // 版本，仅用于前端线上代码版本的识别
        this.VERSION = "0.0001beta";
        this.API_BASE_URL = "https://boomapi.sealapps.com/api/v1/";
        //变体数组
        this.VARIANTS_ARRAY = JSON.parse(document.querySelector('#bm_product_variants')?.textContent || '[]');
        //当前变体
        this.CURRENT_VARIANTS = JSON.parse(document.querySelector('#bm_product_selected_or_first_available_variant')?.textContent);
        //店铺metafile时间戳
        this.SHOP_METAFILE = JSON.parse(document.querySelector("#bm_product_metafields")?.textContent);
        //店铺shopId
        this.shopId = '';
        //挂载产品标题元素
        this.PRODUCT_TITLE_DOM = '';
        //产品积分div dom元素
        this.DIVDOM = '';
        //产品积分span dom元素
        this.productPointsDom = '';
        //产品积分span的闪光元素
        this.POINTSFLASHDOM = '';
        //产品积分dom元素className
        this.productPointsClass = '';
        //产品积分dom元素内容
        this.productPointsText = '';
        //用户卸载或产品显示积分开关或总开关未开启标志位,初始状态开启
        this.OPENFLAG = 1;
        //是否访问过后端
        this.ISACCESS = 0;
        //字体粗细
        this.fontWeight = '';
        //字体颜色
        this.fontColor = '';
        //字体值
        this.fontValue = '';
        //字体大小
        this.fontSize = '';
        //闪光开关
        this.flashStatus = '';
        //闪光颜色
        this.flashColor = '';
        //营销事件翻倍数
        this.pointsMultiples = 0;
        //获得积分类型 1 按比例赠送积分 | 2 固定送积分
        this.earnType = 1;
        //每积分的金额
        this.amount = 0;
        //赠送积分
        this.presentPoints = 0;
        //当前变体购买后赠送的总积分
        this.points = 0;
        //当前变体价格
        this.variantPrice = (this.CURRENT_VARIANTS['price'] || 0) / 100;
        //定时任务清空缓存
        this.setTimeoutHandle = null;
        // 信息上报信息
        this.reportInfosArr = [{
          labelVersion: '1.0',
          porductHref: window.location.href
        }];
        //初始化
        this.init();
    };

    function createSpan(params) {
        let span = document.createElement('span');
        if(params.class != undefined) span.setAttribute('class', params.class);
        if(params.text != undefined) span.innerHTML = params.text;
        return span;
    };

    // className|id|text
    function createDiv(params) {
        let div = document.createElement('div');
        if(params.className !== undefined) div.setAttribute('class', params.className);
        if(params.id !== undefined) div.setAttribute('id', params.id);
        if(params.text !== undefined) div.innerHTML = params.text;
        return div;
    };

    Points.prototype = {
        constructor: Points,

        init: function() {
            this.initSetting();
            this.initStyle();
        },

        initSetting: function() {
            // 店铺ID
            this.shopId = __st.a;
            // 店铺名称
            this.shopName = Shopify.shop;
            //判断metafile时间戳
            if(!this.SHOP_METAFILE){
                return;
            }
            let timeStamp = +new Date() / 1000;
            if(timeStamp-7200 > this.SHOP_METAFILE) {
                return;
            }
            //寻找挂载元素
            this.findProductTitleDom();
        },

        findProductTitleDom: function() {
            //通过class获取产品标题dom元素
            strClassName = '.product__title, .product-single__title, .product-title, .grid-item .h2, .product-single__prices, .price-review';
            let priceDomArr = document.querySelectorAll(strClassName);
            if (priceDomArr.length == 0) {
              this.reportInfosArr.push({
                labelVersion: '1.0',
                shopName: Shopify.shop,
                content: '未找到挂载的元素'
              })
            }
            this.PRODUCT_TITLE_DOM = priceDomArr[0];
            //获取积分配置
            this.getPointsStatus();
        },

        reloadProductPage: function() {
            if(location.href.indexOf('variant=') !== -1) {
                let window_variant_id = Number(location.href.split('variant=')[1])
                if (this.CURRENT_VARIANTS?.id !== window_variant_id) {
                    for(let i = 0; i < this.VARIANTS_ARRAY.length; i++) {
                        if(this.VARIANTS_ARRAY[i].id == window_variant_id) {
                            this.CURRENT_VARIANTS = this.VARIANTS_ARRAY[i];
                            this.variantPrice = (this.CURRENT_VARIANTS['price'] || 0) / 100;
                            this.reportInfosArr = [{
                              labelVersion: '1.0',
                              porductHref: window.location.href
                            }];
                            this.getPointsStatus();
                            break;
                        }
                    }
                }
            }
        },

        getPointsStatus: function() {
           const that = this;
            if(that.OPENFLAG != 1) {
                return;
            }
            if(that.ISACCESS == 1) {
                that.createPointsDom();
            }
            this.ajax({
                url: that.API_BASE_URL + 'script/productPoints',
                data: {
                    shopId: that.shopId,
                    variantId: that.CURRENT_VARIANTS?.id
                },
                success: function(res) {
                    if (res.code == 200 && res.data != null) {
                        let resData = res.data;
                        //用户已卸载或用户不开启按钮
                        if((resData.isDelete == 1) || (resData.allStatus != 1) || (resData.status != 1) || (resData.pointsStatus != 1) || (resData.pointRuleStatus != 1)) {
                            that.OPENFLAG = 0;
                            return;
                        }
                        if(that.OPENFLAG !== 0) {
                          that.ISACCESS = 1;
                          that.fontWeight = resData.fontWeight;
                          that.fontColor = resData.fontColor;
                          that.fontValue = resData.fontValue;
                          that.fontSize = resData.fontSize;
                          that.pointsMultiples = resData.pointsMultiples;
                          that.amount = resData.amount;
                          that.presentPoints = resData.presentPoints;
                          that.flashStatus = resData.flashStatus;
                          that.flashColor = resData.flashColor;
                          that.earnType = resData.earnType;
                          if(!that.VARIANTS_ARRAY && that.earnType === 1) {
                            that.reportInfosArr.push({
                                labelVersion: '1.0',
                                shopName: Shopify.shop,
                                content: '变体数组没找到',
                            })
                          }
                          if(JSON.stringify(that.CURRENT_VARIANTS) === '{}' && that.earnType === 1) {
                              that.reportInfosArr.push({
                                  labelVersion: '1.0',
                                  shopName: Shopify.shop,
                                  content: '当前变体没找到',
                              })
                          }
                          that.createPointsDom();
                        }
                    } else {
                        that.reportInfosArr.push({
                            labelVersion: '1.0',
                            shopName: Shopify.shop,
                            content: res,
                            tip: '初次请求的数据出错'
                        })
                    }
                    if(that.reportInfosArr.length > 1) {
                    //   that.reportInfos();
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    that.reportInfosArr.push({
                        labelVersion: '1.0',
                        shopName: Shopify.shop,
                        XMLHttpRequest: XMLHttpRequest,
                        textStatus: textStatus,
                        errorThrown: errorThrown,
                        content: "请求异常"
                    })
                    // that.reportInfos()
                }
            })
        },

        createPointsDom: function() {
            
            //计算当前变体购买后获得积分
            if (this.earnType == 2) {
              this.points = this.pointsMultiples !== 0 ? this.presentPoints * this.pointsMultiples : this.presentPoints;
            }else {
              this.points = this.pointsMultiples !== 0 ? Math.floor(this.variantPrice / this.amount * this.presentPoints * this.pointsMultiples) :
                             Math.floor(this.variantPrice / this.amount * this.presentPoints)
            }

            // 判断积分数是否存在
            if(!this.points && this.OPENFLAG !== 0) {
                this.reportInfosArr.push({
                    labelVersion: '1.0',
                    shopName: Shopify.shop,
                    points: this.points,
                    pointsType: typeof this.points,
                    content: '积分数不存在(this.points: 考虑所涉及的变量)',
                })
            }
            

            if(this.productPointsDom != '') {
                this.productPointsDom.textContent = this.fontValue.replace('{{points_amount}}', this.points);
                return;
            }
            // let divClassName = 'bm_div_product_points ' + this.PRODUCT_TITLE_DOM.className;
            // console.log(divClassName);
            this.parentDivDom =  createDiv({'className': 'bm_top_product_div',});
            if(getComputedStyle(this.PRODUCT_TITLE_DOM).textAlign && (getComputedStyle(this.PRODUCT_TITLE_DOM).textAlign == 'center')){
                this.parentDivDom.setAttribute('style', 'align-items:center;justify-content:center;');
            }
            this.PRODUCT_TITLE_DOM.insertAdjacentElement('afterend', this.parentDivDom);
            this.DIVDOM = createDiv({'className': 'bm_div_product_points'});
            this.parentDivDom.appendChild(this.DIVDOM);
            this.productPointsClass = 'bm_product_points';
            this.productPointsDom = createSpan({'class': this.productPointsClass, 'text': this.fontValue.replace('{{points_amount}}', this.points)});
            this.productPointsDom.setAttribute('style', 'font-weight:'+ this.fontWeight +';color:'+ this.fontColor +';padding:2px;font-size:'+ this.fontSize +'px;margin:5px 0;cursor:pointer;');
            this.DIVDOM.appendChild(this.productPointsDom);
            this.POINTSFLASHDOM = createDiv({'className': 'points-flash'});
            if (this.flashStatus == 1) {
                this.POINTSFLASHDOM.setAttribute('style', 'background-color: ' + this.flashColor + ';');
            } else {
                this.POINTSFLASHDOM.setAttribute('style', 'visibility: hidden;');
            }
            this.DIVDOM.appendChild(this.POINTSFLASHDOM);
            this.productPointsDom.onclick = function() {
                if(!window.__BooM) {
                    return;
                }
                let BoomDom = window.__BooM;
                if (BoomDom.LAUNCHER_STATE == 1) {
                    BoomDom.startBtn.onclick();
                }
            }

        },

        // 信息上报
        reportInfos: function() {
          const that = this;
          if(that.reportInfosArr) {
            that.ajax({
              url: that.API_BASE_URL + 'dataReport',
              data: {
                  reportData: JSON.stringify(that.reportInfosArr)
              },
            })
          }
        },
      
        initStyle: function() {
            let textStyle = `
            .bm_product_points{font-weight:600;color:#000000;padding:2px;font-size:15px;margin:5px 0;cursor:pointer;}
            .bm_div_product_points{
                position: relative;
                line-height: 1;
                display: inline-block;
            }
            .bm_top_product_div{
                display:flex;
            }
            .points-flash {
                content: '';
                position: absolute;
                background-color: #FFFFFF80;
                -webkit-transform: rotate(45deg);
                transform: rotate(45deg);
                -webkit-animation: blink 1s ease-in 1s infinite;
                animation: blink 0.8s ease-in 1s infinite;
                display: inline-block;
                width: 5px;
                height: 100%;
            }
            @-webkit-keyframes blink {
                from {
                    left: 0;
                    top: 0;
                }
    
                to {
                    left: 100%;
                    top: 0;
                }
            }
    
            @-o-keyframes blink {
                from {
                    left: 0;
                    top: 0;
                }
    
                to {
                    left: 100%;
                    top: 0;
                }
            }
    
            @-moz-keyframes blink {
                from {
                    left: 0;
                    top: 0;
                }
    
                to {
                    left: 100%;
                    top: 0;
                }
            }
    
            @keyframes blink {
                from {
                    left: 0;
                    top: 0;
                }
    
                to {
                    left: 100%;
                    top: 0;
                }
            }`;
            let style = document.createElement('style');
            let text = document.createTextNode(textStyle)
            style.appendChild(text);
            document.body.appendChild(style)
        },

        // ajax方法封装
        ajax: function(options) {
            options = options || {};
            options.type = (options.type || "POST").toUpperCase();
            options.dataType = options.dataType || "json";
            options.timeout = options.timeout || 5000;
            var params = formatParams(options.data);
            var xhr;
            if (window.XMLHttpRequest) {
                xhr = new XMLHttpRequest()
            } else if (window.ActiveObject) {
                xhr = new ActiveXobject("Microsoft.XMLHTTP")
            };
            if(options.type == "GET"){
                xhr.open("GET", options.url + "?" + params, true);
                xhr.responseType = options.dataType;
                xhr.send(null)
            }else if(options.type == "POST"){
                xhr.open("post", options.url, true);
                xhr.responseType = options.dataType;
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.send(params)
            };
            setTimeout(function(){
                if(xhr.readySate != 4){
                    xhr.abort()
                };
            }, options.timeout);
            xhr.onreadystatechange = function(){
                if(xhr.readyState == 4){
                    var status = xhr.status;
                    if((status >= 200 && status < 300) || status == 304){
                        options.success && options.success(xhr.response)
                    }else{
                        options.error && options.error(status)
                    };
                };
            };
            function formatParams(data) {
                var arr = [];
                for (var name in data) {
                    arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]))
                };
                arr.push(("v=" + Math.random()).replace(".", ""));
                return arr.join("&");
            };
        },
    };

    let __POINTS = new Points();

    // 监视DOM结构，重新计算lable积分
    (function watchDOM(global) {
        let previousUrl = '';
        const observer = new MutationObserver(function(mutations) {
            if (global.location.href !== previousUrl) {
                previousUrl = global.location.href;
                __POINTS.reloadProductPage();
            }
        });
        const config = {subtree: true, childList: true};
        observer.observe(document, config);
    })(global)

    return (global.__POINTS == __POINTS)
}(window))