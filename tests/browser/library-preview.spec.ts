import {test,expect} from '@playwright/test';
test('library exposes the accepted expressions and retained professional views',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/library.html');
 const nav=page.getByRole('navigation',{name:'组件展示目录'});
 await expect(nav.getByRole('button')).toHaveCount(6);
 for(const title of ['表达方式','Dashboard 与图表','Trace 瀑布图','Trace 树图','Trace 统计','Span 与回执详情']){
  await nav.getByRole('button',{name:title,exact:true}).click();
  await expect(page.locator('.library-description h2')).toHaveText(title);
  await expect(page.locator('.library-stage')).not.toBeEmpty();
 }
 expect(errors).toEqual([]);
});
test('compact expressions retain optical placement, corner status and useful tooltips',async({page})=>{
 await page.goto('/library.html');
 await expect(page.locator('.expression-stage .expression-widget')).toHaveCount(18);
 for(const id of ['state','value','range']){
  const w=page.locator(`.expression-widget[data-example-id="${id}"]`);
  await expect(w).toHaveCSS('width','160px');await expect(w).toHaveCSS('height','160px');
  await expect(w.locator('footer')).toHaveCount(0);
  await w.locator('.expression-corner-status').hover();await expect(page.getByRole('tooltip')).toHaveText('当前结果可用');
  await page.mouse.move(0,0);await expect(page.getByRole("tooltip")).toHaveCount(0);
 }
 await page.locator('.expression-range-high').hover();await expect(page.getByRole('tooltip')).toContainText('40—100');
});
test('dashboard drag retains an empty snapped ghost beneath the moving card',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});await page.goto('/library.html');
 await page.getByRole('button',{name:'Dashboard 与图表',exact:true}).click();
 await page.getByRole('button',{name:'Edit dashboard',exact:true}).click();
 const card=page.locator('.dashboard-panel[data-panel-id="value"]');const box=(await card.boundingBox())!;
 await page.mouse.move(box.x+70,box.y+85);await page.mouse.down();await page.mouse.move(box.x+270,box.y+210,{steps:12});
 const ghost=page.locator('.react-grid-placeholder');await expect(ghost).toBeVisible();await expect(ghost).toBeEmpty();
 expect(await ghost.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(48, 48, 48)');
 await page.mouse.up();await expect(ghost).toHaveCount(0);
});
