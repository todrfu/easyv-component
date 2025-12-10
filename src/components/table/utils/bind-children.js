export function bindChildren(configs,data){
    const bindedChildren = configs.map((config) =>{
        let childData = data.find((d)=>(d.id === config.id))
        return{
            id:config.id,
            config,
            data:childData
        }
    });
    return bindedChildren;
}