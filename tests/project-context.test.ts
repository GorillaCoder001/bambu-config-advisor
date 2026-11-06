import {it,expect} from 'vitest';
import {detectProjectContext} from '../src/analysis/project-context';
import {parseCurrentSettings} from '../src/recommendations/current-settings';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
import {box} from './fixtures';
const a=analyzeMesh(box(105,112,75));
const detect=(v:object)=>detectProjectContext(parseCurrentSettings(JSON.stringify(v)),'Gengar_smartphone_holder.3mf',a);
it('detects five PETG slots, printer and nozzle from the saved project without using preview colour',()=>{
 const found=detect({filament_type:Array(5).fill('PETG'),filament_settings_id:Array(5).fill('Generic PETG @BBL X2D'),filament_colour:['#330099','#FFBBDD','#FFFFFF','#FF0000','#000000'],printer_model:'Bambu Lab X2D',nozzle_diameter:['0.4','0.4']});
 expect(found.patch).toMatchObject({material:'PETG',manufacturer:'Generic',colorCount:5,printer:'X2D',nozzle:.4,use:'Functional'});expect(found.filaments[2].color).toBe('#FFFFFF');
});
it('recognizes a known matte product and its vendor from the profile identity',()=>{expect(detect({filament_type:['PETG'],filament_settings_id:['eSUN PETG-Matte @BBL X2D']}).patch).toMatchObject({material:'PETG Matte',manufacturer:'eSUN',profile:'eSUN PETG-Matte'});});
it('does not turn mixed materials, untyped slots or composites into a single PLA profile',()=>{
 expect(detect({filament_type:['PETG','PLA']}).patch.material).toBe('Other');
 expect(detect({filament_colour:['#FFFFFF']}).patch.material).toBe('Other');
 expect(detect({filament_type:['PLA-CF']}).patch.material).toBe('Other');
});
it('does not invent material from STL shape or carry a detected badge without metadata',()=>{const found=detectProjectContext(null,'phone_holder.stl',a);expect(found.patch.material).toBeUndefined();expect(found.filaments).toEqual([]);expect(found.notes[0]).toContain('No filament metadata');});
it('keeps unlike nozzle diameters unresolved and rejects CSS-like colour metadata',()=>{const found=detect({nozzle_diameter:['0.4','0.6'],filament_type:['PETG'],filament_colour:['url(https://example.com)']});expect(found.patch.nozzle).toBeUndefined();expect(found.filaments[0].color).toBeUndefined();});
it('uses a recognized profile identity when the type column is absent',()=>{expect(detect({filament_settings_id:['Bambu PLA Matte @BBL X2D']}).patch.material).toBe('PLA Matte');});

it('distinguishes an A1 mini profile from the shorter A1 name',()=>{expect(detect({printer_settings_id:'Bambu Lab A1 mini 0.4 nozzle',filament_type:['PLA']}).patch.printer).toBe('A1 mini');});
