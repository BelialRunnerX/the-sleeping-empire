import {GLTFLoader} from '../vendor/GLTFLoader.js';
let template, pending;
export function loadPistolModel(){return pending??=new GLTFLoader().loadAsync(new URL('../assets/items/aethercoil-pistol.glb',import.meta.url).href).then(({scene})=>{if(!scene.getObjectByName('Muzzle'))throw Error('Pistol muzzle missing');template=scene;return scene;}).catch(error=>{pending=null;throw error;});}
export function createPistolModel(){if(!template)return null;const model=template.clone(true);model.name='Aethercoil detailed pistol';model.scale.setScalar(1.2);model.userData.pistolModel='original-glb-v1';model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.sharedFieldAsset=true;}});return model;}
