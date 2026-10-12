import {describe,it,expect} from 'vitest';
import {box,merge} from './fixtures';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {defaults} from '../src/profiles/printers';
import {recommend,exportText} from '../src/recommendations/engine';
import {parseCurrentSettings,comparisonStatus,currentValue} from '../src/recommendations/current-settings';
import {settingPath,studioSettingVisible} from '../src/recommendations/studio-layout';
const a=analyzeMesh(box());
const groups=(tab:string)=>[...new Set(recommend(a,defaults).settings.filter(s=>s.tab===tab).map(s=>s.group))];
describe('Studio placement matches supplied screenshots and official layout',()=>{
 it('places Quality sections in screenshot order with Ironing before Wall generator and Advanced',()=>expect(groups('Quality')).toEqual(['Layer height','Line width','Seam','Precision','Ironing','Wall generator','Advanced']));
 it('contains every Strength control shown in the screenshot, in the same relative order',()=>{
  const screenshot=['wall_loops','alternate_extra_wall','embedding_wall_into_infill','detect_thin_wall','top_surface_pattern','top_surface_density','top_shell_layers','top_shell_thickness','top_color_penetration_layers','bottom_surface_pattern','bottom_surface_density','bottom_shell_layers','bottom_shell_thickness','bottom_color_penetration_layers','internal_solid_infill_pattern','sparse_infill_density','fill_multiline','sparse_infill_pattern','sparse_infill_anchor','sparse_infill_anchor_max','infill_wall_overlap','infill_direction','bridge_angle','minimum_sparse_infill_area','infill_combination','detect_narrow_internal_solid_infill','ensure_vertical_shell_thickness','detect_floating_vertical_shell'];
  const rows=recommend(a,defaults).settings.filter(s=>s.tab==='Strength');expect(rows.filter(s=>screenshot.includes(s.key)).map(s=>s.key)).toEqual(screenshot);expect(groups('Strength')).toEqual(['Walls','Top/bottom shells','Sparse infill','Advanced']);
 });
 it('includes the missing Seam, Precision, Arachne and bridge controls from the Quality screenshot',()=>{
  const r=recommend(a,{...defaults,detail:true});const keys=['seam_placement_away_from_overhangs','seam_slope_conditional','scarf_angle_threshold','seam_slope_entire_loop','seam_slope_steps','seam_slope_inner_walls','override_filament_scarf_seam_setting','role_base_wipe_speed','slice_closing_radius','enable_arc_fitting','xy_hole_compensation','xy_contour_compensation','enable_circle_compensation','precise_z_height','wall_transition_angle','wall_transition_filter_deviation','wall_transition_length','wall_distribution_count','min_bead_width','min_feature_size','bridge_flow','thick_bridges','counterbore_hole_bridging','top_one_wall_type'];for(const key of keys)expect(r.settings.some(s=>s.key===key),key).toBe(true);
 });
 it('moves speeds and support interface values to their actual Studio sections',()=>{
  const r=recommend(analyzeMesh(merge(box(),box(60,60,5,[0,0,40]))),defaults);const row=(key:string)=>r.settings.find(s=>s.key===key)!;
  expect(settingPath(row('bridge_speed'))).toBe('Process → Speed → Other layers speed → Bridge');expect(settingPath(row('support_top_z_distance'))).toBe('Process → Support → Advanced → Top Z distance');expect(settingPath(row('support_interface_top_layers'))).toBe('Process → Support → Advanced → Top interface layers');expect(settingPath(row('travel_speed'))).toBe('Process → Speed → Travel speed → Travel');
 });
 it('sorts Other tabs as Studio does, including skirt before brim and threshold before build-plate-only',()=>{
  const r=recommend(a,defaults);const keys=r.settings.map(s=>s.key);expect(keys.indexOf('skirt_loops')).toBeLessThan(keys.indexOf('brim_type'));expect(keys.indexOf('support_threshold_angle')).toBeLessThan(keys.indexOf('support_on_build_plate_only'));expect(keys.indexOf('small_perimeter_speed')).toBeLessThan(keys.indexOf('sparse_infill_speed'));
 });
 it('reveals process scarf override controls only when the override is enabled',()=>{
  const off=parseCurrentSettings('{"override_filament_scarf_seam_setting":false,"seam_slope_type":"none"}');const on=parseCurrentSettings('{"override_filament_scarf_seam_setting":true,"seam_slope_type":"external"}');for(const [current,visible]of [[off,false],[on,true]] as const){const r=recommend(a,defaults,current);const row=r.settings.find(s=>s.key==='seam_slope_type')!;expect(studioSettingVisible(row,r.settings,current)).toBe(visible);expect(row.visibility).toContain('Override filament scarf seam setting');}
 });
 it('shows Arachne controls when they are required by a recommendation',()=>{const r=recommend(a,{...defaults,detail:true});const row=r.settings.find(s=>s.key==='wall_transition_length')!;expect(studioSettingVisible(row,r.settings)).toBe(true);const classic=recommend(a,defaults);expect(studioSettingVisible(classic.settings.find(s=>s.key===row.key)!,classic.settings)).toBe(false);});
 it('keeps calibrated bridge flow and does not invent a new numeric override',()=>{const current=parseCurrentSettings('{"bridge_flow":"1.5"}');expect(recommend(a,defaults,current).settings.find(s=>s.key==='bridge_flow')?.value).toBe('1.5');expect(recommend(a,defaults).settings.find(s=>s.key==='bridge_flow')?.value).toContain('Keep current');});
 it('preserves three decimal places for precision resolution',()=>expect(recommend(a,{...defaults,detail:true}).settings.find(s=>s.key==='resolution')?.value).toBe('0.012 mm'));
 it('normalizes equivalent Studio stored/display wall-order values',()=>{const c=parseCurrentSettings('{"wall_sequence":"inner wall/outer wall"}');const row=recommend(a,defaults).settings.find(s=>s.key==='wall_sequence')!;expect(currentValue(c,row)).toBe('inner/outer');expect(comparisonStatus(c,row)).toBe('same');});
 it('keeps filament temperature and fan subfields on their actual dialog paths',()=>{const r=recommend(a,defaults);const row=(key:string)=>r.settings.find(s=>s.key===key)!;expect(settingPath(row('textured_plate_temp'))).toBe('Filament settings → Filament → Print temperature → Textured PEI Plate → Other layers');expect(settingPath(row('fan_min_speed'))).toBe('Filament settings → Cooling → Part cooling fan → Min fan speed threshold → Fan speed');expect(row('first_x_layer_part_fan_speed')).toBeTruthy();expect(r.settings.some(s=>s.key==='initial_part_fan')).toBe(false);});
 it('hides Jerk controls for Bambu hardware rather than presenting them as available settings',()=>{const r=recommend(a,defaults);const jerk=r.settings.find(s=>s.key==='default_jerk')!;expect(studioSettingVisible(jerk,r.settings)).toBe(false);expect(jerk.visibility).toContain('hidden for Bambu');});
 it('exports exact paths and visibility instructions as well as values',()=>{const text=exportText(recommend(a,defaults),a,defaults);expect(text).toContain('Process → Quality → Precision → Slice gap closing radius');expect(text).toContain('Process → Strength → Advanced → Infill/Wall overlap');expect(text).toContain('Enable “Override filament scarf seam setting”');});
 it('represents every standard process recommendation with a concrete navigation path',()=>{for(const row of recommend(a,defaults).settings.filter(s=>['Quality','Strength','Speed','Support','Others'].includes(s.tab))){expect(row.location?.[0],row.key).toBe('Process');expect(row.location?.[1],row.key).toBe(row.tab);expect(row.location?.[2],row.key).toBe(row.group);}});
});

describe('Studio infill storage names versus visible dropdown labels',()=>{
 it.each(['top_surface_pattern','bottom_surface_pattern','internal_solid_infill_pattern','sub_top_surface_pattern'])('shows Rectilinear for the stored zig-zag value in %s',key=>{
  const current=parseCurrentSettings(JSON.stringify({[key]:'zig-zag'}));const row=recommend(a,defaults,current).settings.find(s=>s.key===key)!;
  expect(currentValue(current,row)).toBe('Rectilinear');
  if(row.intent==='retain'){expect(row.value).toBe('Rectilinear');expect(comparisonStatus(current,row)).toBe('same');}
  const text=exportText(recommend(a,defaults,current),a,defaults,current);expect(text).not.toContain('Current: zig-zag');expect(text).toContain('Current: Rectilinear');
 });
 it('distinguishes Rectilinear from the separate sparse-infill Zig Zag option',()=>{
  const current=parseCurrentSettings('{"sparse_infill_pattern":"zigzag"}');const row=recommend(a,defaults).settings.find(s=>s.key==='sparse_infill_pattern')!;expect(currentValue(current,row)).toBe('Zig Zag');
  const rectilinear=parseCurrentSettings('{"sparse_infill_pattern":"zig-zag"}');expect(currentValue(rectilinear,row)).toBe('Rectilinear');
 });
 it('resolves non-translated literal dropdown labels such as Fuzzy Skin noise type',()=>{const current=parseCurrentSettings('{"fuzzy_skin_noise_type":"ridgedmulti"}');const row=recommend(a,defaults,current).settings.find(s=>s.key==='fuzzy_skin_noise_type')!;expect(currentValue(current,row)).toBe('Ridged Multifractal');expect(row.value).toBe('Ridged Multifractal');});
});

describe('filament dialog matches supplied screenshot',()=>{
 it('uses the native Filament tab and all four screenshot sections in order',()=>{
  const r=recommend(a,defaults);expect([...new Set(r.settings.filter(s=>s.tab==='Filament').map(s=>s.group))]).toEqual(['Basic information','Print temperature','Volumetric speed limitation','Filament scarf seam settings']);expect(r.settings.some(s=>['drying','ams_drying','enclosure','range'].includes(s.key))).toBe(false);expect(r.materialNotes.join(' ')).toContain('Drying:');
 });
 it('includes all screenshot fields with correctly ordered paired subfields',()=>{
  const fields=['filament_type','filament_vendor','default_filament_colour','filament_diameter','filament_metal_stickiness','filament_flow_ratio','filament_density','filament_shrink','filament_velocity_adaptation_factor','filament_cost','temperature_vitrification','filament_prime_volume','filament_prime_volume_nc','filament_change_length','filament_change_length_nc','filament_ramming_travel_time','filament_ramming_travel_time_nc','filament_pre_cooling_temperature','filament_pre_cooling_temperature_nc','nozzle_temperature_range_low','nozzle_temperature_range_high','chamber_temperatures','supertack_plate_temp_initial_layer','supertack_plate_temp','cool_plate_temp_initial_layer','cool_plate_temp','eng_plate_temp_initial_layer','eng_plate_temp','hot_plate_temp_initial_layer','hot_plate_temp','textured_plate_temp_initial_layer','textured_plate_temp','nozzle_temperature_initial_layer','nozzle_temperature','filament_adaptive_volumetric_speed','filament_max_volumetric_speed','filament_ramming_volumetric_speed','filament_ramming_volumetric_speed_nc','filament_scarf_seam_type','filament_scarf_height','filament_scarf_gap','filament_scarf_length'];
  expect(recommend(a,defaults).settings.filter(s=>fields.includes(s.key)).map(s=>s.key)).toEqual(fields);
 });
 it('uses exact paths for nozzle bounds, plate stages, ramming and filament scarf settings',()=>{
  const r=recommend(a,defaults);const row=(key:string)=>r.settings.find(s=>s.key===key)!;
  expect(settingPath(row('nozzle_temperature_range_low'))).toBe('Filament settings → Filament → Basic information → Recommended nozzle temperature → Min');
  expect(settingPath(row('supertack_plate_temp_initial_layer'))).toBe('Filament settings → Filament → Print temperature → Cool Plate SuperTack → Initial layer');
  expect(settingPath(row('filament_ramming_volumetric_speed_nc'))).toBe('Filament settings → Filament → Volumetric speed limitation → Ramming volumetric speed → Hotend change');
  expect(settingPath(row('filament_scarf_seam_type'))).toBe('Filament settings → Filament → Filament scarf seam settings → Scarf seam type');
 });
 it('renders actual filament enums and mixed percent/mm units without guessing a variant',()=>{
  const c=parseCurrentSettings('{"filament_metal_stickiness":["High"],"filament_scarf_seam_type":["none"],"filament_scarf_height":["10%"],"filament_scarf_gap":["0%"],"filament_prime_volume":["45"],"filament_cost":["17.99"]}');const r=recommend(a,defaults,c);const value=(key:string)=>r.settings.find(s=>s.key===key)!.value;
  expect(value('filament_metal_stickiness')).toBe('High');expect(value('filament_scarf_seam_type')).toBe('None');expect(value('filament_scarf_height')).toBe('10%');expect(value('filament_scarf_gap')).toBe('0%');expect(value('filament_prime_volume')).toBe('45 mm³');expect(value('filament_cost')).toBe('17.99 money/kg');
 });
 it('keeps separate Extruder change and Hotend change values and sentinel meanings',()=>{
  const c=parseCurrentSettings('{"filament_ramming_volumetric_speed":["-1"],"filament_ramming_volumetric_speed_nc":["-1"],"filament_change_length":["10","12"],"filament_change_length_nc":["10"]}');const r=recommend(a,defaults,c);const row=(key:string)=>r.settings.find(s=>s.key===key)!;expect(row('filament_change_length').value).toBe('Variant-specific: 10 mm / 12 mm');expect(row('filament_change_length_nc').value).toBe('10 mm');expect(row('filament_ramming_volumetric_speed').reason).toContain('-1 uses');
 });
 it('places cooling settings in their own native groups with nested layer-time fields',()=>{
  const rows=recommend(a,defaults).settings.filter(s=>s.tab==='Cooling');expect([...new Set(rows.map(s=>s.group))]).toEqual(['Part cooling fan','Auxiliary part cooling fan','Exhaust fan']);expect(settingPath(rows.find(s=>s.key==='fan_cooling_layer_time')!)).toBe('Filament settings → Cooling → Part cooling fan → Min fan speed threshold → Layer time');expect(settingPath(rows.find(s=>s.key==='first_x_layer_fan_speed')!)).toBe('Filament settings → Cooling → Auxiliary part cooling fan → Initial layer fan → Fan speed');
 });
 it('does not invent plate support or change existing exact-filament temperature rules',()=>{const r=recommend(a,{...defaults,material:'PETG Matte',manufacturer:'eSUN',profile:'eSUN PETG-Matte'});expect(r.settings.find(s=>s.key==='nozzle_temperature_range_low')?.value).toBe('240°C');expect(r.settings.find(s=>s.key==='nozzle_temperature_range_high')?.value).toBe('260°C');expect(r.settings.find(s=>s.key==='textured_plate_temp')?.value).toBe('70°C');expect(r.settings.find(s=>s.key==='supertack_plate_temp')?.value).toContain('required');});
 it('keeps drying instructions in exported preparation notes',()=>{const text=exportText(recommend(a,{...defaults,material:'PETG',manufacturer:'Bambu Lab',profile:'Bambu PETG Basic'}),a,defaults);expect(text).toContain('Filament preparation notes');expect(text).toContain('Drying: 65°C');});
});

it('does not show an active chamber temperature control for a P1S preset',()=>{const r=recommend(a,{...defaults,printer:'P1S'});const row=r.settings.find(s=>s.key==='chamber_temperatures')!;expect(studioSettingVisible(row,r.settings)).toBe(false);expect(row.visibility).toContain('chamber temperature control');});
