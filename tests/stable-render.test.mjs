import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('Dashboard aktualisiert nur bei veränderten Daten',()=>{
 const html=file('index.html');
 assert.match(html,/hblUpdateHtml\(el,nextHtml\)/);
 assert.match(html,/if\(otherList\.dataset\.renderStamp===stamp\)return/);
 assert.match(html,/hblUpdateHtml\(target,nextHtml\)/);
 assert.match(html,/if\(grid\.dataset\.renderStamp===stamp\)return/);
});
test('Mitarbeit wird kursbezogen wiederverwendet',()=>{
 const html=file('index.html');
 assert.match(html,/hblActivateView\('participation:'\+courseId\)/);
 assert.match(html,/hblSetView\('participation:'\+courseId,/);
 assert.match(html,/if\(host\.dataset\.renderStamp===stampForView\(\)\)return/);
});
test('Kursansichten behalten DOM und vermeiden unnötige Re-Renders',()=>{
 const course=file('hbl-course-page.js');
 assert.match(course,/const cachedContents=new Map\(\),seatViews=new Map\(\),renderStamps=new Map\(\)/);
 assert.match(course,/function switchCourseContent\(host,key\)/);
 assert.match(course,/if\(renderStamps\.get\(key\)===stamp&&host\.childNodes\.length\)return/);
 assert.match(course,/if\(nav\.dataset\.visibleStamp!==visibleStamp\)/);
 assert.doesNotMatch(course,/document\.body\.innerHTML/);
});
test('Mobilnavigation besteht bei Wechsel im selben Bereich fort',()=>{
 const mobile=file('mobile.js');
 assert.match(mobile,/if\(previous\?\.dataset\.navMode===mode\)return/);
 assert.match(mobile,/onWorkspace/);
});
