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
