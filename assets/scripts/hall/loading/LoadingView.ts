/*
 * @CreateTime: Aug 7, 2019 3:46 PM 
 * @Author: undefined 
 * @Contact: undefined 
* @Last Modified By: howe
* @Last Modified Time: Nov 28, 2019 4:16 PM
 * @Description: Modify Here, Please  
 * 加载界面逻辑
 */
import engine from "../../core/Engine";
import { ezplugin } from "../../core/ezplugin/ezplugin";
import { gui } from "../../core/gui/GUI";
import { ViewLayout } from "../../core/ui/ViewLayout";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { AsyncQueue } from "../../core/util/AsyncQueue";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import Config from "../../service/config/Config";
import { Prompt_Size, Prompt_Type } from "../../service/prompt/Prompt";
import { service } from "../../service/Service";
import { AssetsHotUpdateEVent } from "../../version/AssetsHotUpdate";
import LoginView from "../login/LoginView";

const { ccclass, property } = cc._decorator;
@ccclass
export default class LoadingView extends ViewLayout {
    private viewObj: HashMap<string, cc.Node> = null;
    private loginState = 0;
    onLoad() {
        this.viewObj = ViewUtils.nodeTreeInfoLite(this.node);
        this.viewObj.get("progressBar").active = false;
        this.viewObj.get("btns").active = false;
        // this.viewObj.get("lab_version").getComponent(cc.Label).string = main.appRes.appresUrlHelper.appVersion;
        let buildversion = ezplugin.sysInfo["versionCode"] || ezplugin.sysInfo["buildVersion"];
        if (!buildversion) {
            buildversion = "";
        }
        this.viewObj.get("lab_version").getComponent(cc.Label).string = `${engine.appVersion}(${buildversion})`;
        ViewUtils.fullscreen(this.viewObj.get("bg"))
        cc.log("LoadingView onLoad")
    }

    onAdded(params: any) {
        cc.log("LoadingView onAdded params", params)
        this.loadRes();
    }
    private isLock: boolean = false;
    /**
     * 加载游戏通用资源
     */
    loadRes() {
        this.viewObj.get("lab_loading_tip").getComponent(cc.Label).string = "assets loading";

        this.viewObj.get("progressBar").active = true;
        this.viewObj.get("lab_progress").active = true;
        this.viewObj.get("lab_patch_progress").active = false;
        this.viewObj.get("progressBar").getComponent(cc.ProgressBar).progress = 0;
        let asyncQueue = new AsyncQueue();
        asyncQueue.push((next) => {
            cc.loader.loadResDir("langjson", (err) => {
                if (err) {
                    cc.log(JSON.stringify(err));
                }
                next();
            });
        });
        asyncQueue.push((next) => {
            cc.loader.loadResDir("audio", (err) => {
                if (err) {
                    cc.log(JSON.stringify(err));
                }
                next();
            });
        });
        asyncQueue.push((next) => {
            cc.loader.loadResDir("main", (completedCount: number, totalCount: number, item: any) => {
                let progress = completedCount / totalCount;
                this.viewObj.get("lab_progress").getComponent(cc.Label).string = (Math.ceil(progress * 100) + "%");
                this.viewObj.get("progressBar").getComponent(cc.ProgressBar).progress = progress;
            }, (err) => {
                if (err) {
                    cc.log(JSON.stringify(err));
                }
                next();
            });
        })
        asyncQueue.complete = () => {
            this.showLogin();
        }
        asyncQueue.play()
    }

    showLogin() {
        this.viewObj.get("progressBar").active = false;
        this.node.getComponent(LoginView).viewObj = this.viewObj;
        this.node.getComponent(LoginView).showLogin(this.loginState == 0);
    }

    onDestroy() {
        super.onDestroy();
        this.viewObj = null;
        cc.loader.releaseResDir("loading");
    }
}

