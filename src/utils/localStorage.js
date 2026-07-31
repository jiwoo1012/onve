export const saveLocal=(key, value)=>{
    window.localStorage.setItem(key, JSON.stringify(value))
}

export const loadLocal=(key, failback=null)=>{
    try{
        // 성공 자리
        return JSON.parse(window.localStorage.getItem(key)) ?? failback
    }catch{
        // 실패 자리
        return failback
    }
}