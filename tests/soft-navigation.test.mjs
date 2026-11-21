import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('Interne Navigation behält die App-Shell und den Browser-Verlauf',()=>{
 const html=source('index.html');
 assert.match(html,/const hblViewCache=new Map\(\)/);
 assert.match(html,/history\.pushState\(/);
 assert.match(html,/addEventListener\('popstate'/);
 assert.match(html,/hblActivateView\('home'\)/);
 assert.match(html,/hblActivateView\('participation'\)/);
 assert.doesNotMatch(html,/document\.body\.innerHTML\s*=/);
});
test('Kurswechsel ersetzt nicht den gesamten Body',()=>{
 const course=source('hbl-course-page.js');
 assert.match(course,/function navigate\(courseId,mode\)/);
 assert.match(course,/function syncNavigation\(courseId,view,courses\)/);
 assert.doesNotMatch(course,/document\.body\.innerHTML\s*=/);
});
test('Mobile Navigation reagiert auf Routenwechsel ohne kumulierende Listener',()=>{
 const mobile=source('mobile.js');
 assert.match(mobile,/addEventListener\('hbl-route-changed',init\)/);
 assert.match(mobile,/controller\.abort\(\)/);
});
