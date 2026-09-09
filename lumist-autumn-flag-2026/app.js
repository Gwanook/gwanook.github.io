/* The same canvas is used for preview and export, keeping the downloaded layout identical. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fields = ['mentor-name','department','goal','action','outcome'];
  const departments = Array.from($('department').options, option => option.value).filter(Boolean);
  const presets = [
    {title:'让每一堂课都有收获',goal:'把每一堂课，讲到学生真正理解。',action:'课前找准薄弱点，课中多问一句为什么，课后留下一份清晰的知识总结。',outcome:'从“听懂了”，到“我能独立做出来”。'},
    {title:'陪学生多走一步',goal:'多看见一点学生的努力，多给一份具体的鼓励。',action:'每周记录学生的一个小进步，遇到困难时，一起拆解问题和下一步行动。',outcome:'从“我真的不会”，到“我想再试一次”。'},
    {title:'让方法真正留下来',goal:'让学生带走的，不只是答案，还有解决问题的方法。',action:'每周复盘高频错题，整理一份可复用的解题清单，再请学生讲一遍思路。',outcome:'面对新问题，也能找到自己的解题方向。'}
  ];
  const titles = {cheer:['新学期，','认真发光。'],heart:['多一份耐心，','多一点成长。'],ready:['今天也要，','认真上好课。']};
  const fonts = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
  const canvas = $('poster');
  const ctx = canvas.getContext('2d');
  let assets = {};
  let ready = false;
  let exportBusy = false;
  let imageUrl = null;
  let imageFile = null;
  let toastTimer;
  const clean = value => String(value ?? '').replace(/\s+/g,' ').trim();
  const graphemes = text => typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter('zh-CN',{granularity:'grapheme'}).segment(text),s=>s.segment)
    : Array.from(text);
  const state = () => ({
    name:clean($('mentor-name').value),
    department:clean($('department').value),
    goal:clean($('goal').value),action:clean($('action').value),outcome:clean($('outcome').value),
    mascot:document.querySelector('input[name="mascot"]:checked')?.value || 'cheer'
  });
  function text(content,x,y,size=32,weight=400,color='#262a26',align='left') {
    ctx.font=`${weight} ${size}px ${fonts}`;
    ctx.fillStyle=color;ctx.textBaseline='top';ctx.textAlign=align;
    ctx.fillText(content,x,y);
  }
  function fittedText(content,x,y,maxWidth,size,weight=700,color='#262a26',align='left') {
    ctx.font=`${weight} ${size}px ${fonts}`;
    while(ctx.measureText(content).width>maxWidth && size>16){size-=1;ctx.font=`${weight} ${size}px ${fonts}`;}
    text(content,x,y,size,weight,color,align);
  }
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  function line(x,y,x2,y2,color='#d5d6cb',width=1){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
  function wrap(content,width,size,weight=500){
    ctx.font=`${weight} ${size}px ${fonts}`;
    const lines=[];let current='';
    for(const ch of graphemes(content)){
      if(current && ctx.measureText(current+ch).width>width){
        if(/[，。！？、；：）》】”’]/.test(ch) && current.length>1){
          const units=graphemes(current); const last=units.pop(); lines.push(units.join(''));current=last+ch;
        }else{lines.push(current);current=ch.trimStart();}
      }else current+=ch;
    }
    if(current)lines.push(current);
    return lines;
  }
  function paragraph(content,x,y,width,height,preferredSize=40){
    let size=preferredSize,lines=wrap(content,width,size);
    while(lines.length*size*1.4>height && size>22){size--;lines=wrap(content,width,size);}
    if(lines.length*size*1.4>height)throw new Error('Flag 内容过长，请精简后再试。');
    lines.forEach((value,i)=>text(value,x,y+i*size*1.4,size,600));
  }
  function draw(){
    if(!ready || !ctx)return;
    const s=state(); const example=presets[0];
    rect(0,0,1080,1620,'#ffcf43');
    ctx.drawImage(assets.logo,70,64,237,68);
    text('师者有光，秋启新程',1005,76,25,600,'#3f3d26','right');
    text('2026 · 教师节暨秋季开学动员大会',1005,115,18,400,'#5a542f','right');
    text('MY AUTUMN FLAG',74,204,23,600,'#665624');
    const mainTitle=titles[s.mascot];
    const headlineSize=s.mascot==='cheer'?102:91;
    text(mainTitle[0],68,260,headlineSize,900);
    text(mainTitle[1],68,386,headlineSize,900);
    rect(75,512,s.mascot==='cheer'?488:527,12,s.mascot==='heart'?'#f69086':'#85bddb');
    ctx.drawImage(assets[s.mascot],662,264,351,351);
    text('把每一份热爱，变成看得见的行动。',74,565,31,500,'#4f4729');
    rect(56,650,968,837,'#fffefa');
    rect(56,650,8,837,'#2c4437');
    text('路觅导师',104,688,19,500,'#758077');
    fittedText(s.name || '你的名字',104,721,520,49,800);
    fittedText(s.department || '你的学科组',973,735,300,24,500,'#697568','right');
    line(105,793,975,793,'#d9dfd6',1.5);
    const rows=[
      {n:'01',label:'我会在新学期重点做到',value:s.goal||example.goal,y:828,bodyY:869,height:133,size:41},
      {n:'02',label:'我准备通过',value:s.action||example.action,y:1034,bodyY:1076,height:170,size:37},
      {n:'03',label:'我希望帮助学生实现',value:s.outcome||example.outcome,y:1280,bodyY:1322,height:136,size:40}
    ];
    for(const row of rows){
      text(row.n,104,row.y,23,500,'#8b9389');
      text(row.label,157,row.y,23,500,'#697568');
      paragraph(row.value,104,row.bodyY,866,row.height,row.size);
    }
    text('路觅导师，懂学生，管结果。',540,1530,28,700,'#2d392c','center');
    text('2026 AUTUMN  /  每一个认真出发的你，都在发光',540,1573,16,500,'#665624','center');
    canvas.setAttribute('aria-label',`${s.name||'导师'}的秋季 Flag。重点目标：${s.goal||example.goal} 行动：${s.action||example.action} 期待：${s.outcome||example.outcome}`);
  }
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('小鹿素材加载失败，请点击重新加载。'));im.src=src;});}
  async function loadAssets(){
    ready=false;$('download').disabled=true;$('loading-overlay').hidden=false;$('asset-error').hidden=true;
    $('poster-frame').setAttribute('aria-busy','true');
    try{
      const entries=await Promise.all(['cheer','heart','ready','logo'].map(async name=>[name,await loadImage(window.LUMIST_EMBEDDED_ASSETS?.[name] || `./assets/${name}.${name==='logo'?'svg':'png'}`)]));
      assets=Object.fromEntries(entries);
      if(document.fonts?.ready)await document.fonts.ready;
      ready=true;draw();$('download').disabled=false;
    }catch(e){$('asset-error').hidden=false;}
    finally{$('loading-overlay').hidden=true;$('poster-frame').setAttribute('aria-busy','false');}
  }
  function update(){
    for(const id of ['goal','action','outcome']) $(id+'-count').textContent=`${$(id).value.length} / ${$(id).maxLength}`;
    draw();
  }
  function validate(){
    $('form-error').hidden=true;
    fields.forEach(id=>$(id).removeAttribute('aria-invalid'));
    const needed=[['mentor-name','请填写导师姓名。'],['department','请选择学科组。'],['goal','请写下你新学期的重点目标。'],['action','请写下你准备采取的行动。'],['outcome','请写下你希望帮助学生实现的变化。']];
    for(const[id,message]of needed){
      if(!clean($(id).value)){$(id).setAttribute('aria-invalid','true');$('form-error').textContent=message;$('form-error').hidden=false;$(id).focus();return false;}
    }
    return true;
  }
  function notify(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
  function flagCopy(s){return `【秋季Flag】\n${s.department} · ${s.name}\n\n我会在新学期重点做到：${s.goal}\n我准备通过：${s.action}\n我希望帮助学生实现：${s.outcome}\n\n路觅导师，懂学生，管结果。`;}
  async function copyFlag(){
    if(!validate())return;
    const content=flagCopy(state());
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(content);
      else{
        const temp=document.createElement('textarea');temp.value=content;temp.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(temp);temp.focus();temp.select();const copied=document.execCommand('copy');temp.remove();if(!copied)throw new Error('Clipboard unavailable');
      }
      notify('Flag 文案已复制');
    }catch{notify('当前浏览器暂不支持复制，请下载海报分享。');}
  }
  function filename(s){return `路觅秋季Flag-${s.name.replace(/[\\/:*?"<>|]/g,'_')}.png`;}
  async function exportPoster(event){
    event?.preventDefault();
    if(exportBusy || !validate())return;
    if(!ready){notify('小鹿素材还未准备好，请稍后重试。');return;}
    exportBusy=true;$('download').disabled=true;$('download').querySelector('span').textContent='正在生成…';
    try{
      const s=state();
      draw();
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('图片生成失败，请重试。')),'image/png'));
      if(imageUrl)URL.revokeObjectURL(imageUrl);
      imageUrl=URL.createObjectURL(blob);imageFile=new File([blob],filename(s),{type:'image/png'});
      $('result-image').src=imageUrl;$('save-image').href=imageUrl;$('save-image').download=filename(s);
      $('share-image').hidden=!(navigator.canShare && navigator.canShare({files:[imageFile]}));
      $('result-dialog').showModal();
      if(!matchMedia('(pointer:coarse)').matches){const a=document.createElement('a');a.href=imageUrl;a.download=filename(s);document.body.append(a);a.click();a.remove();}
    }catch(e){notify(e.message||'海报生成失败，请重试。');}
    finally{exportBusy=false;$('download').disabled=false;$('download').querySelector('span').textContent='生成并下载海报';}
  }
  fields.forEach(id=>$(id).addEventListener('input',()=>{$(id).removeAttribute('aria-invalid');update();}));
  document.querySelectorAll('input[name="mascot"]').forEach(input=>input.addEventListener('change',update));
  $('flag-form').addEventListener('submit',exportPoster);
  $('copy').addEventListener('click',copyFlag);
  $('retry-assets').addEventListener('click',loadAssets);
  $('share-image').addEventListener('click',async()=>{
    if(!imageFile)return;
    try{await navigator.share({files:[imageFile],title:'我的秋季 Flag'});}catch(e){if(e.name!=='AbortError')notify('分享未完成，可以保存海报后发送到导师群。');}
  });
  $('inspiration').addEventListener('click',()=>$('inspiration-dialog').showModal());
  presets.forEach(p=>{
    const button=document.createElement('button');button.type='button';button.className='inspiration-item';
    const title=document.createElement('strong');title.textContent=p.title;
    const goal=document.createElement('p');goal.textContent=p.goal;
    const action=document.createElement('p');action.textContent=p.action;
    const icon=document.createElement('i');icon.dataset.lucide='arrow-up-right';
    button.append(title,goal,action,icon);
    button.addEventListener('click',()=>{
      if(['goal','action','outcome'].some(id=>clean($(id).value)) && !confirm('用这组参考替换当前填写的三段 Flag 吗？'))return;
      ['goal','action','outcome'].forEach(id=>$(id).value=p[id]);update();$('inspiration-dialog').close();$('goal').focus();
    });
    $('inspiration-list').append(button);
  });
  document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  window.lucide?.createIcons();
  loadAssets();

  // Optional browser-agent access uses the same inputs and validation as the visible form.
  const modelContext=document.modelContext;
  if(modelContext?.registerTool){
    const lifecycle=new AbortController();
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
    const schema={type:'object',properties:{name:{type:'string',minLength:1,maxLength:20},department:{type:'string',enum:departments},goal:{type:'string',minLength:1,maxLength:60},action:{type:'string',minLength:1,maxLength:90},outcome:{type:'string',minLength:1,maxLength:60},mascot:{type:'string',enum:['cheer','heart','ready']}},required:['name','department','goal','action','outcome'],additionalProperties:false};
    const tool={name:'configure_flag_poster',title:'填写秋季 Flag 海报',description:'填写导师资料与三段 Flag，更新可见海报预览。不会下载、发送或上传内容。',inputSchema:schema,annotations:{readOnlyHint:false,untrustedContentHint:true},async execute(input){
      if(!input || typeof input!=='object')throw new Error('Expected poster fields');
      for(const[k,max]of[['name',20],['department',24],['goal',60],['action',90],['outcome',60]])if(typeof input[k]!=='string'||!clean(input[k])||input[k].length>max)throw new Error(`Invalid ${k}`);
      if(!departments.includes(clean(input.department)))throw new Error('Invalid department');
      if(input.mascot && !['cheer','heart','ready'].includes(input.mascot))throw new Error('Invalid mascot');
      $('mentor-name').value=clean(input.name);
      $('department').value=clean(input.department);
      for(const id of ['goal','action','outcome'])$(id).value=clean(input[id]);
      if(input.mascot)document.querySelector(`input[name="mascot"][value="${input.mascot}"]`).checked=true;
      update();await new Promise(resolve=>requestAnimationFrame(resolve));return {status:'preview_updated',...state()};
    }};
    try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  }
})();
