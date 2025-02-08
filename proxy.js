const { Relay, Player } = require('bedrock-protocol');
const crypto = require('crypto');
const fs = require('fs');
const prompt = require('prompt-sync')();

let m = {}
let rc, h, p
let wt;

const rs = prompt('Server Or Realm: ')

if (rs === 'server' || rs === 's'){
  h = prompt('Host: ')
  p = prompt('Port: ')
  m = {
    host: h,
    port: Number(p)
  }
  wt = 'Server'
} else if (rs === 'realm' || rs === 'r'){
  rc = prompt('Realm Code: ')
  m = {
    realms: {
      realmInvite: rc
    }
  }
  wt = 'Realm'
} else {
  process.exit()
}

let runtimeid, pos, px, py, pz, dx, dy, dz, taptp, tx, ty, tz, hurtcam, knockback, killaura, autohit, sx, sy, sz, sneak, particles, targetid, deathspawn, respawned, newprefix, prefix, mpos, mx, my, mz, tracers;
let cps = 1000; // its 1 click per second by default
const prefixfile = 'prefix.txt';

if (!fs.existsSync(prefixfile)){
  fs.writeFileSync(prefixfile, '.', 'utf8')
}

fs.readFile(prefixfile, 'utf8', (error, text) => {
  if (error){
    console.error(error);
    return;
  }
  prefix = text.toString()
  console.log(`Prefix: ${prefix}`)
});

process.on('uncaughtException', (error) => {
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(promise, reason);
});

const main = async () => {
  const relay = new Relay({
    username: 'username',
    host: '0.0.0.0',
    port: 19132,
    skinData: { 
      CurrentInputMode: 3, 
      DefaultInputMode: 3, 
      DeviceModel: 'Orbis',
      DeviceOS: 11
    },
    destination: m
  });
  relay.listen();
  
  relay.on('connect', (player) => {
    console.log(`Connected from ${player.connection.address}`);
        
        const check = (abc) => {
          let a = Number(abc)
          return isNaN(a) ? 0.1 : a;
        }
        
        function say(msg){
          player.write('text', {
            type: 'raw',
            needs_translation: false,
            source_name: '',
            message: msg,
            parameters: [],
            xuid: '',
            platform_chat_id: '',
            filtered_message: msg
          });
        }
        
        function hit(target){
          if (targetid !== undefined){
            player.write('inventory_transaction', {
              transaction: {
                legacy: { legacy_request_id: 0 },
                transaction_type: 'item_use_on_entity',
                actions: [],
                transaction_data: {
                  entity_runtime_id: target,
                  action_type: 'attack',
                  hotbar_slot: 0,
                  held_item: {
                    network_id: 0,
                  },
                  player_pos: { x: px, y: py, z: pz },
                  click_pos: { x: 0, y: 0, z: 0 }
                }
              }
            });
            player.write('interact', {
              action_id: 'mouse_over_entity',
              target_entity_id: targetid,
              position: { x: px, y: py, z: pz }
            });
          }
        }
        
        function particle(bx, by, bz){
          player.write('spawn_particle_effect', {
            dimension: 0,
            entity_id: '-1',
            position:{ x: bx, y: by, z: bz },
            particle_name: 'minecraft:glow_particle',
            molang_variables:{ type: 'Buffer', data: [] }
          });
        }
        
        function trace(c1, c2) {
          const dx = c2.x - c1.x, dy = c2.y - c1.y, dz = c2.z - c1.z;
          const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
          for (let i = 0; i <= steps; i++){
            const t = i / steps;
            const x = +(c1.x + t * dx).toFixed(2);
            const y = +(c1.y + t * dy).toFixed(2);
            const z = +(c1.z + t * dz).toFixed(2);
            particle(x, y, z)
          }
        }
      
        function killaura1(){
          if (killaura === 1){
            if (targetid !== undefined){
              hit(targetid)
            }
          }
          setTimeout(killaura1, cps)
        }
        
        killaura1()
        
        const round = (num) => +num.toFixed(2);
        let sc = true;
        
        player.on('clientbound', ({ name, params }, des) => {
          if (name === 'move_player'){
            targetid = params.runtime_id;
            if (targetid == runtimeid){
              console.log('set targetid as self')
              targetid = undefined;
            } else {
              mpos = params.position;
              const { x, y, z } = mpos;
              mx = x.toFixed(2); my = y.toFixed(2); mz = z.toFixed(2)
            }
          }
            if (name === 'start_game') {
              runtimeid = params.runtime_entity_id;
              sx = params.spawn_position.x; sy = params.spawn_position.y; sz = params.spawn_position.z;
              let seed = params.seed.toString();
              let hardcore = params.hardcore;
              if (hardcore === true){ hardcore = 'On' } else {
                hardcore = 'Off'
              }
              let difficulty = params.difficulty;
              if (difficulty === 0){ difficulty = 'Peaceful' }
              if (difficulty === 1){ difficulty = 'Easy' }
              if (difficulty === 2){ difficulty = 'Medium' }
              if (difficulty === 3){ difficulty = 'Hard' }
                let achievements = params.achievements_disabled;
                if (achievements == false){ achievements = 'On' } else {
                  achievements = 'Off'
                }
                let ontrial = params.is_trial;
                if (ontrial === true){ ontrial = 'Yes' } else {
                  ontrial = 'No'
                }
                let ticks = Number(params.current_tick);
                let secs = ticks / 20; let mins = secs / 60;
                let hours = mins/ 60; let days = hours / 24;
                hours = round(hours); days = round(days)
                console.log(`\nSeed: ${seed}\nHardcore: ${hardcore}\nDifficulty: ${difficulty}\nSpawn Cords: x: ${sx} y: ${sy} z: ${sz}\nAchievements: ${achievements}\nOn Trial: ${ontrial}\nWorld Existing Time in Ticks: ${ticks}\nWorld Existing Time IRL: ${days} Days ( ${hours} hours )\n\nJoined ${wt}\n`)
                if (sy > 320){
                  sc = false;
                }
            }
            if (name === 'death_info'){
              dx = px; dy = py; dz = pz;
            }
            if (name === 'set_entity_motion'){
              if (knockback === 1){
                params.velocity = { x: 0, y: 0, z: 0 }
              }
            }
            if (name === 'entity_event'){
              if (params.event_id === 'hurt_animation'){
                if (hurtcam === 1){
                  des.canceled = true;
                }
              }
            }
            if (name === 'level_event'){
              if (particles === 1){
                if (params.event.toLowerCase().includes('particle')){
                  des.canceled = true;
                }
              }
            }
        });
        
        player.on('serverbound', ({ name, params }, des) => {
          if (name === 'player_action' && params.action === 'respawn' && deathspawn === 1){
            if (dx !== undefined && dy !== undefined && dz !== undefined){
              dy = dy + 1;
              player.write('move_entity', {
                runtime_entity_id: runtimeid,
                flags: 0b00000010,
                position: { x: dx, y: dy, z: dz },
                rotation: { x: dx, y: dy, z: dz }
              });
            }
          }
          if (name === 'player_auth_input'){
            pos = params.position;
            const { x, y, z } = pos;
            px = x.toFixed(2); py = y.toFixed(2); pz = z.toFixed(2)
            if (tracers === 1){
              if (mpos !== undefined){
                trace(pos, mpos)
                mpos = undefined
              }
            }
            if (params.block_action){
              params.block_action.forEach(action => {
                const { x, y, z } = action.position;
                tx = x; ty = y + 2.7; tz = z;
                if (taptp === 1){
                  player.write('move_entity', {
                    runtime_entity_id: runtimeid,
                    flags: 0b00000010,
                    position: { x: tx, y: ty, z: tz },
                    rotation: { x: tx, y: ty, z: tz }
                  });
                }
              });
            }
          }
          if (name === 'inventory_transaction'){
            if (killaura === 1){
              player.write('animate', {
                runtime_entity_id: runtimeid,
                action_id: 'swing_arm'
              });
            }
          }
          if (name === 'animate'){
            if (params.action_id === 'swing_arm'){
              if (autohit === 1 && targetid !== undefined){
                hit(targetid)
              }
            }
          }
          if (name === 'text'){
            console.log(`<${params.source_name}> ${params.message}`);
            if (params.message === 'rp'){
              fs.writeFile(prefixfile, '.', (error) => {
                if (error) {
                  console.error(error);
                  return;
                } else {
                  fs.readFile(prefixfile, 'utf8', (error, text) => {
                    if (error) {
                      console.error(error);
                      return;
                    }
                    prefix = text;
                    say(`§d§lPrefix: ${prefix}`)
                  });
                }
              });
              des.canceled = true;
              return;
            }
            if (!params.message.startsWith(prefix)){
              return;
            }
            const input = params.message.split(' ');
            const command = input[0].substring(1);
            try {
              switch (command) {
                case 'help': {
                  const commands = ['gamemode', 'shake', 'jumpboost',
                  'nightvision', 'alleffects', 'levitation',
                  'tp', 'taptp', 'speed', 'killaura', 'knockback',
                  'hurtcam', 'lastdeathposition', 'autohit', 'worldspawn',
                  'particles', 'gamespeed', 'deathspawn', 'prefix', 'tracers'];
                  const cmds = `§d§lAFN PROXY\n§b${commands.map(cmd => ` • ${cmd}`).join('\n')}`;
                  say(cmds)
                  break;
                }
                case 'g':
                case 'gamemode': {
                  const [_, mode] = input;
                  let gamemode;
                  if (mode == 'c' || mode == 'creative' || mode == '1'){
                    gamemode = 1;
                  } else if (mode == 's' || mode == 'survival' || mode == '0'){
                    gamemode = 0;
                  } else if (mode == 'sp' || mode == 'spectator' || mode == '6'){
                    gamemode = 6;
                  } else if (mode == 'd' || mode == 'default' || mode == '5'){
                    gamemode = 5;
                   } else {
                      say(`§4§lInput creative, survival, spectator or default`)
                      des.canceled = true;
                      return;
                    }
                    if (gamemode !== undefined) {
                      player.write("set_player_game_type", { gamemode: gamemode });
                    }
                    say(`§d§lGamemode: ${mode} - ${gamemode}`)
                    break;
                }
                case 'shake': {
                  let [_, time] = input;
                  time = parseFloat(time)
                  player.write('camera_shake', {
                    intensity: 4.0,
                    duration: time || 3.0,
                    type: 0,
                    action: 0
                  });
                  break;
                }
                case 'nv':
                case 'nightvision': {
                  player.write('mob_effect', {
                    runtime_entity_id: runtimeid,
                    event_id: 1,
                    effect_id: 16,
                    amplifier: 10,
                    particles: false,
                    duration: 100000,
                    tick: 0
                  });
                  break;
                }
                case 'af':
                case 'alleffects': {
                  for (let i = 0; i < 32; i++) {
                    player.write('mob_effect', {
                      runtime_entity_id: runtimeid,
                      event_id: 1,
                      effect_id: i,
                      amplifier: 1,
                      particles: false,
                      duration: 1000,
                      tick: 0
                    });
                  }
                  break;
                }
                case 'tp': {
                  let [_, x, y, z] = input;
                  x = check(x); y = check(y); z = check(z);
                  player.write('move_entity', {
                    runtime_entity_id: runtimeid,
                    flags: 0b00000010,
                    position: { x: x, y: y + 2.7, z: z },
                    rotation: { x: x, y: y + 2.7, z: z }
                  });
                  break;
                }
                case 'd':
                case 'disconnect': {
                  player.write('disconnect', {
                    reason: 'unknown',
                    hide_disconnect_reason: false,
                    message: '§d§lUsed the disconnect command',
                    filtered_message: params.filtered_message
                  });
                  break;
                }
                case 'speed': {
                  let [_, speed] = input;
                  speed = check(speed)
                  player.write('update_attributes', {
                    runtime_entity_id: runtimeid,
                    tick: 0,
                    attributes: [{ 
                      name: 'minecraft:movement',
                      min: 0,
                      max: speed,
                      current: speed,
                      default_min: 0,
                      default_max: speed,
                      default: speed,
                      modifiers: [{
                        id: crypto.randomUUID(),
                        name: crypto.randomUUID(),
                        amount: speed,
                        operation: 1,
                        operand: 0,
                        serializable: true
                      }]
                    }]
                  });
                  break;
                }
                case 'jb':
                case 'jumpboost': {
                  let [_, time, amount] = input;
                  time = Number(time) * 20
                  amount = Number(amount)
                  if (isNaN(time)){
                    time = 600
                  }
                  if (isNaN(amount)){
                    amount = 1
                  }
                  player.write('mob_effect', {
                    runtime_entity_id: runtimeid,
                    event_id: 1,
                    effect_id: 8,
                    amplifier: amount || 1,
                    particles: false,
                    duration: time || 600,
                    tick: 0
                  });
                  break;
                }
                case 'lv':
                case 'levitation': {
                  let [_, time, amount] = input;
                  time = Number(time) * 20
                  amount = Number(amount)
                  if (isNaN(time)){
                    time = 600
                  }
                  if (isNaN(amount)){
                    amount = 1
                  }
                  player.write('mob_effect', {
                    runtime_entity_id: runtimeid,
                    event_id: 1,
                    effect_id: 24,
                    amplifier: amount || 1,
                    particles: false,
                    duration: time || 600,
                    tick: 0
                  });
                  break;
                }
                case 'ldp':
                case 'lastdeathposition': {
                  say(`§d§lLast Death Position: x: ${dx} y: ${dy} z: ${dz}`)
                  break;
                }
                case 'tt':
                case 'taptp': {
                  let on;
                  if (taptp === 1){
                    taptp = 0
                    on = 'OFF'
                  } else {
                    taptp = 1
                    on = 'ON'
                  }
                  say(`§d§lTapTP: ${on}`)
                  break;
                }
                case 'hc':
                case 'hurtcam': {
                  let on;
                  if (hurtcam === 1){
                    hurtcam = 0
                    on = 'ON'
                  } else {
                    hurtcam = 1
                    on = 'OFF'
                  }
                  say(`§d§lHurtcam: ${on}`)
                  break;
                }
                case 'kb':
                case 'knockback': {
                  let on;
                  if (knockback === 1){
                    knockback = 0
                    on = 'ON'
                  } else {
                    knockback = 1
                    on = 'OFF'
                  }
                  say(`§d§lKnockback: ${on}`)
                  break;
                }
                case 'ka':
                case 'killaura': {
                  let [_, abc] = input;
                  if (abc === undefined){
                    let on;
                    if (killaura === 1){
                      killaura = 0
                      on = 'OFF'
                    } else {
                      killaura = 1
                      on = 'ON'
                    }
                    say(`§d§lKillaura: ${on}`)
                  } else {
                    abc = Number(abc)
                    if (isNaN(abc)){
                      say(`§4§lInput a number`)
                    } else {
                      cps = 1000 / abc;
                      say(`§b§lCPS: ${abc}`)
                    }
                  }
                  break;
                }
                case 'at':
                case 'autohit': {
                  let on;
                  if (autohit === 1){
                    autohit = 0
                    on = 'OFF'
                  } else {
                    autohit = 1
                    on = 'ON'
                  }
                  say(`§d§lAutohit: ${on}`)
                  break;
                }
                case 'ws':
                case 'worldspawn': {
                  if (sc === true){
                    player.write('move_entity', {
                      runtime_entity_id: runtimeid,
                      flags: 0b00000010,
                      position: { x: sx, y: sy + 2.7, z: sz },
                      rotation: { x: sx, y: sy + 2.7, z: sz }
                    });
                  } else {
                    say(`§4§lCouldnt get correct spawn Y coordinates`)
                  }
                  break;
                }
                case 'pt':
                case 'particles': {
                  let on;
                  if (particles === 1){
                    particles = 0
                    on = 'ON'
                  } else {
                    particles = 1
                    on = 'OFF'
                  }
                  say(`§d§lParticles: ${on}`)
                  break;
                }
                case 'gs':
                case 'gamespeed': {
                  let [_, gamespeed] = input;
                  gamespeed = Number(gamespeed)
                  if (isNaN(gamespeed) || gamespeed === undefined){
                    des.canceled = true;
                    return say('§4§lInput a number')
                  }
                  if (gamespeed <= 0){
                    des.canceled = true;
                    return say('§4§lInput a number higher than 0')
                  }
                  player.write('level_event', {
                    event: 'set_game_speed',
                    position: { x: 1, y: 0, z: 0 },
                    data: 0
                  });
                  player.write('level_event', {
                    event: 'set_game_speed',
                    position: { x: gamespeed, y: 0, z: 0 },
                    data: 0
                  });
                  say(`§d§lGamespeed: ${gamespeed}`)
                  break;
                }
                case 'ds':
                case 'deathspawn': {
                  let on;
                  if (deathspawn === 1){
                    deathspawn = 0
                    on = 'OFF'
                  } else {
                    deathspawn = 1
                    on = 'ON'
                  }
                  say(`§d§lDeathspawn: ${on}`)
                  break;
                }
                case 'prefix': {
                  const blocked = ['/', 'rp']
                  const [_, p] = input;
                  if (p !== undefined){
                    if (blocked.some(block => p.startsWith(block))){
                      say(`§4§lYoure not allowed to set the prefix as ${p}`)
                      des.canceled = true;
                      return;
                    }
                    fs.writeFile(prefixfile, p, (error) => {
                      if (error){
                        console.error(error);
                        return;
                      } else {
                        fs.readFile(prefixfile, 'utf8', (error, text) => {
                          if (error){
                            console.error(error);
                            return;
                          }
                          prefix = text;
                          say(`§d§lPrefix: ${prefix}`)
                        });
                      }
                    });
                  } else {
                    say(`§4§lYou have to input something`)
                  }
                }
                case 't':
                case 'tracers': {
                  let on;
                  if (tracers === 1){
                    tracers = 0
                    on = 'OFF'
                  } else {
                    tracers = 1
                    on = 'ON'
                  }
                  say(`§d§lTracers: ${on}`)
                  break;
                }
                default:
                  break;
                }
            } catch (error){
              console.error(error);
            }
              des.canceled = true;
            }
        });
    });
};

main().catch(console.error);