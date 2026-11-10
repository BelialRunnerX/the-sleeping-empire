import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mainMenuMarkup, menuSettingsMarkup } from '../engine/main-menu.mjs';
test('main menu escapes profile names and offers explicit world entry',()=>{const html=mainMenuMarkup({name:'<script>alert(1)</script>'},{level:3});assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(html.includes('data-action="menu-enter"'));assert(html.includes('Enter the frontier'));assert(html.includes('never replaces'));});
test('established character continues and settings reflect preferences',()=>{assert(mainMenuMarkup({name:'Elys'},{race:'human',calling:'warrior',level:5}).includes('Continue adventure'));const html=menuSettingsMarkup({quality:'low',reducedMotion:true},{autoFire:false,autoTarget:true},true);assert(html.includes('value="low" selected'));assert(html.includes('Auto fire: OFF'));assert(html.includes('Sound: OFF'));});
