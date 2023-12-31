const axios = require('axios')

const checkin_url = "https://glados.rocks/api/user/checkin"
const status_url = "https://glados.rocks/api/user/status"
const referer = 'https://glados.rocks/console/checkin'
const origin = "https://glados.rocks"
const useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"
const payload = { 
        'token': 'glados.one'
      }

function go_checkin_url(cookie){
    return axios(checkin_url, {
        method: 'POST',
        data: payload,
        headers: {
            'Cookie': cookie,
            'referer': referer,
            'Origin': origin,
            'User-Agent': useragent,
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })

}

function go_status_url(cookie){
    return axios(status_url, {
        method: 'GET',
        headers: {
            'Cookie': cookie,
            'referer': referer,
            'Origin': origin,
            'User-Agent': useragent
        }
    })
}

async function getGladosCookie() {
    let GLADOS_COOKIE = process.env.GLADOS_COOKIE || [];

    let GLADOS_COOKIE_ARR = []

    if (GLADOS_COOKIE.indexOf('&') > -1)
        GLADOS_COOKIE_ARR = GLADOS_COOKIE.split('&')
    else 
        GLADOS_COOKIE_ARR = [GLADOS_COOKIE]

    if (!GLADOS_COOKIE_ARR.length) {
        console.error("未获取到GLADOS_COOKIE, 程序终止")
        process.exit(0);
    }
    
    return GLADOS_COOKIE_ARR
}

async function sent_message_by_pushplus(message) {
    const PUSHPLUS_TOKEN = process.env.PUSHPLUS_TOKEN;

    if (!PUSHPLUS_TOKEN) {
        return;
    }
    console.log("=> 发送pushplus: \n", message);
    let timer = new Date()
    let data = {
        token: PUSHPLUS_TOKEN,
        title: "glados-chenkin_" + timer.toLocaleString(),
        content: message
    }

    try {
        await axios.post("http://www.pushplus.plus/send", data);
        console.log("=> 发送pushplus成功");
    } catch (error) {
        console.log("=> 发送pushplus失败:");
        console.error(error);
    }
}

!(async () => {

    const GLADOS_COOKIE_ARR = await getGladosCookie()
    let index = 1
    const message = []
    for await (GLADOS_COOKIE of GLADOS_COOKIE_ARR) {
        let remarks = "账号" + index
        try {

            let checkin_result = await go_checkin_url(GLADOS_COOKIE);
            let statis_result = await go_status_url(GLADOS_COOKIE);

            let msg = checkin_result.data.message
            let leftdays = parseInt(statis_result.data.data.leftDays)
            let email = statis_result.data.data.email

            if(msg && leftdays && email)
                remarks += "---" + email + "---结果---" + msg + "---剩余(" + leftdays + ")天"
            else
                remarks += "---"  + "cookie已失效"
            
            console.log(remarks)
            message.push(remarks)

        } catch (e) {
            console.error(e)
            message.push(remarks + "---" +e)
        }
        index++
    }
    await sent_message_by_pushplus(message.join('\n'));
})()
