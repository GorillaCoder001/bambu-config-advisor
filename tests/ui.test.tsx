// @vitest-environment jsdom
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render as renderApp,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react';
import App from '../src/App';
// These legacy interaction tests exercise the optional full Studio controls.
function render(ui:React.ReactNode){const mounted=renderApp(ui);fireEvent.click(screen.getByText('All Studio controls & current settings'));return mounted;}
import {binary,mf,xml} from './fixtures';
import {strToU8} from 'fflate';
import {parseModel} from '../src/analysis/parsers';
import {analyzeMesh} from '../src/analysis/mesh-analysis';
vi.mock('../src/components/ModelViewer',()=>({ModelViewer:({mesh}:{mesh:any})=><div aria-label="Interactive model preview">{mesh?mesh.positions.length/9+' triangles':'Waiting'}</div>}));
class TestWorker {
 onmessage:((e:any)=>void)|null=null;onerror:((e:any)=>void)|null=null;terminated=false;
 postMessage(d:any){queueMicrotask(()=>{if(this.terminated)return;try{const mesh=parseModel(d.buffer,d.filename);this.onmessage?.({data:{type:'complete',mesh,analysis:analyzeMesh(mesh)}});}catch(e){this.onmessage?.({data:{type:'error',message:(e as Error).message}});}});}
 terminate(){this.terminated=true;}
}
beforeEach(()=>{vi.stubGlobal('Worker',TestWorker);vi.stubGlobal('URL',class extends URL {static createObjectURL=vi.fn(()=>'blob:test');static revokeObjectURL=vi.fn();});Object.defineProperty(navigator,'clipboard',{value:{writeText:vi.fn().mockResolvedValue(undefined)},configurable:true});vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});vi.spyOn(window,'print').mockImplementation(()=>{});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('workspace interaction contract',()=>{
 it('shows privacy statement, demo geometry and process tabs',()=>{render(<App/>);expect(screen.getByText('Your model is analyzed locally in your browser and is not uploaded to a server.')).toBeTruthy();expect(screen.getByText('DEMO MODEL')).toBeTruthy();expect(screen.getByRole('tab',{name:'Quality'}).getAttribute('aria-selected')).toBe('true');});
 it('switches tabs and exposes exact field labels',()=>{render(<App/>);fireEvent.click(screen.getByRole('tab',{name:'Strength'}));expect(within(screen.getByRole('tabpanel')).getByText('Wall loops')).toBeTruthy();expect(screen.getByRole('tab',{name:'Strength'}).getAttribute('aria-selected')).toBe('true');});
 it('supports keyboard tab navigation',()=>{render(<App/>);fireEvent.keyDown(screen.getByRole('tab',{name:'Quality'}),{key:'ArrowRight'});expect(screen.getByRole('tab',{name:'Strength'}).getAttribute('aria-selected')).toBe('true');});
 // Multi-step jsdom scenarios need headroom on shared CI runners; assertions still cover every state.
 it('advances through all settings tabs from the bottom, clears filtering and focuses the next tab',{timeout:10000},()=>{
  const scrollIntoView=vi.fn();vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false})));Object.defineProperty(HTMLElement.prototype,'scrollIntoView',{value:scrollIntoView,configurable:true});
  render(<App/>);const tablist=within(screen.getByRole('tablist',{name:'Bambu Studio settings'})),bottom=within(screen.getByRole('navigation',{name:'Settings navigation'}));fireEvent.change(screen.getByLabelText('Filter settings'),{target:{value:'no matching setting'}});
  for(const name of ['Strength','Speed','Support','Others','Filament','Cooling','Quality']){
   fireEvent.click(bottom.getByRole('button',{name:new RegExp((name==='Quality'?'First tab':'Next tab')+' · '+name)}));
   const tab=tablist.getByRole('tab',{name});expect(tab.getAttribute('aria-selected')).toBe('true');expect(document.activeElement).toBe(tab);expect((screen.getByLabelText('Filter settings') as HTMLInputElement).value).toBe('');
  }
  expect(scrollIntoView).toHaveBeenCalledTimes(7);expect(scrollIntoView).toHaveBeenLastCalledWith({behavior:'smooth',block:'start',inline:'nearest'});delete (HTMLElement.prototype as any).scrollIntoView;
 });
 it('returns to the page top and respects reduced motion',()=>{
  vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true})));const scrollTo=vi.spyOn(window,'scrollTo').mockImplementation(()=>{});render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Back to top'}));expect(scrollTo).toHaveBeenCalledWith({top:0,behavior:'instant'});expect(document.activeElement).toBe(document.getElementById('page-top'));
 });
 it('changes context and recommendations dynamically',()=>{render(<App/>);fireEvent.change(screen.getByLabelText('Intended use'),{target:{value:'Functional'}});fireEvent.click(screen.getByRole('tab',{name:'Strength'}));expect(within(screen.getByRole('tabpanel')).getByText('3')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Quality'}));expect(screen.getByText('0.1 mm layers')).toBeTruthy();});
 it('handles unsupported upload without losing the current model',()=>{render(<App/>);fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[new File(['bad'],'bad.obj')]}});expect(screen.getByRole('alert').textContent).toContain('Unsupported');expect(screen.getByText('Sample coaster')).toBeTruthy();});
 it('uploads a model and displays real analysis',async()=>{render(<App/>);const f=new File([binary()],'my-part.stl');Object.defineProperty(f,'arrayBuffer',{value:async()=>binary()});fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[f]}});await waitFor(()=>expect(screen.getByText('my-part.stl')).toBeTruthy());expect(screen.getByText('20 × 20 × 20')).toBeTruthy();});
 it('selects an overhang sample and changes support setting',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Overhang'}));fireEvent.click(screen.getByRole('tab',{name:'Support'}));expect(within(screen.getByRole('tabpanel')).getByText('ON')).toBeTruthy();});
 it('copies all settings with report limitations',async()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Copy all'}));await waitFor(()=>expect(navigator.clipboard.writeText).toHaveBeenCalled());expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toContain('No G-code or importable preset');});
 it('exports JSON and calls print',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'JSON'}));expect(URL.createObjectURL).toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Print'}));expect(window.print).toHaveBeenCalled();});
 it('shows key comparisons without a giant table',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Compare modes'}));expect(screen.getByText('Find your balance')).toBeTruthy();expect(screen.getByRole('table')).toBeTruthy();});
 it('opens manufacturer/profile preferences and source guidance',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Filament profile & preferences'}));expect(screen.getByLabelText('Manufacturer')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Research'}));expect(screen.getByText('Official sources')).toBeTruthy();expect(screen.getByRole('link',{name:'Download full source matrix'})).toBeTruthy();});
 it('exposes print guide explanations',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Print guide'}));expect(screen.getByText('Volumetric flow')).toBeTruthy();expect(screen.getByText('Fit and clearance')).toBeTruthy();});
});


describe('current-to-recommended settings',()=>{
 it('shows missing values without inventing current defaults and accepts manual edits',()=>{render(<App/>);const input=screen.getByRole('textbox',{name:'Current Layer height Layer height'}) as HTMLInputElement;expect(input.value).toBe('');expect(input.placeholder).toBe('Not provided');fireEvent.change(input,{target:{value:'0.'}});expect(input.value).toBe('0.');fireEvent.change(input,{target:{value:'0.24 mm'}});expect(input.value).toBe('0.24 mm');expect(screen.getAllByText('Change suggested').length).toBeGreaterThan(0);});
 it('imports current project settings after uploading 3MF',async()=>{render(<App/>);const buffer=mf(xml(),{'Metadata/project_settings.config':strToU8('{"layer_height":"0.2","wall_loops":"4"}')});const f=new File([buffer],'current-project.3mf');Object.defineProperty(f,'arrayBuffer',{value:async()=>buffer});fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[f]}});await waitFor(()=>expect((screen.getByLabelText('Current Layer height Layer height') as HTMLInputElement).value).toBe('0.2 mm'));expect(screen.getByRole('region',{name:'Current Bambu Studio settings'}).textContent).toContain('Bambu 3MF project');});
 it('merges process and filament JSON and clears imported values',()=>{render(<App/>);const input=screen.getByLabelText('Paste current settings JSON');fireEvent.change(input,{target:{value:'{"layer_height":"0.2"}'}});fireEvent.click(screen.getByRole('button',{name:'Apply current settings'}));fireEvent.change(input,{target:{value:'{"nozzle_temperature":["220"]}'}});fireEvent.click(screen.getByRole('button',{name:'Apply current settings'}));expect((screen.getByLabelText('Current Layer height Layer height') as HTMLInputElement).value).toBe('0.2 mm');fireEvent.click(screen.getByRole('button',{name:'Clear current settings'}));expect((screen.getByLabelText('Current Layer height Layer height') as HTMLInputElement).value).toBe('');});
 it('includes both current and recommended values in copied reports',async()=>{render(<App/>);fireEvent.change(screen.getByLabelText('Current Layer height Layer height'),{target:{value:'0.2 mm'}});fireEvent.click(screen.getByRole('button',{name:'Copy all'}));await waitFor(()=>expect(navigator.clipboard.writeText).toHaveBeenCalled());expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toContain('Current: 0.2 mm → Recommended:');});
 it('clears previous project settings when switching to a geometry-only model',async()=>{render(<App/>);fireEvent.change(screen.getByLabelText('Current Layer height Layer height'),{target:{value:'0.2 mm'}});const buffer=binary();const f=new File([buffer],'new.stl');Object.defineProperty(f,'arrayBuffer',{value:async()=>buffer});fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[f]}});await waitFor(()=>expect(screen.getByText('new.stl')).toBeTruthy());expect((screen.getByLabelText('Current Layer height Layer height') as HTMLInputElement).value).toBe('');});
});

describe('exact Studio navigation',()=>{
 it('shows plain explanations and exposes trade-offs, checks and an exact official definition link',()=>{
  render(<App/>);const row=screen.getByLabelText('Current Layer height Layer height').closest('.setting-row')!;expect(row.textContent).toContain('What it does');expect(row.textContent).toContain('Why this value');expect(row.textContent).toContain('roughly');const summary=row.querySelector('.setting-help summary')!;expect(summary.textContent).toContain('Trade-offs, checks & sources');expect(row.querySelector('.setting-help a')).toBeNull();fireEvent.click(summary);expect(row.querySelector('.setting-help')?.hasAttribute('open')).toBe(true);expect(row.querySelector('.setting-help a')?.getAttribute('href')).toMatch(/PrintConfig.cpp#L\d+$/);fireEvent.click(summary);expect(row.querySelector('.setting-help a')).toBeNull();
  fireEvent.change(screen.getByLabelText('Filter settings'),{target:{value:'path simplification tolerance'}});expect(screen.getByLabelText('Current Precision Resolution')).toBeTruthy();
 });
 it('shows Quality sections in Studio order and a path on each row',()=>{render(<App/>);const panel=screen.getByRole('tabpanel');expect([...panel.querySelectorAll('.setting-group h4')].map(e=>e.textContent)).toEqual(['Layer height','Line width','Seam','Precision','Ironing','Wall generator','Advanced']);expect(screen.getByText('Process → Quality → Precision → Slice gap closing radius')).toBeTruthy();});
 it('shows the complete Strength sections including fields from the attached example',()=>{render(<App/>);fireEvent.click(screen.getByRole('tab',{name:'Strength'}));expect(screen.getByText('Top paint penetration layers')).toBeTruthy();expect(screen.getByText('Internal solid infill pattern')).toBeTruthy();expect(screen.getByText('Length of sparse infill anchor')).toBeTruthy();expect(screen.getByText('Infill/Wall overlap')).toBeTruthy();expect(screen.getByText('Process → Strength → Advanced → Infill/Wall overlap')).toBeTruthy();});
 it('reveals hidden scarf controls with instructions, and after the override is entered',{timeout:10000},()=>{render(<App/>);const panel=within(screen.getByRole('tabpanel'));expect(screen.queryByLabelText('Current Seam Scarf seam type')).toBeNull();fireEvent.click(screen.getByLabelText('Show conditional controls'));expect(screen.getByLabelText('Current Seam Scarf seam type')).toBeTruthy();expect(panel.getAllByText(/Enable “Override filament scarf seam setting”/).length).toBeGreaterThan(0);fireEvent.click(screen.getByLabelText('Show conditional controls'));fireEvent.change(screen.getByLabelText('Current Seam Override filament scarf seam setting'),{target:{value:'ON'}});expect(screen.getByLabelText('Current Seam Scarf seam type')).toBeTruthy();});
});

it('renders imported internal solid infill as Rectilinear in both comparison columns',()=>{
 render(<App/>);fireEvent.change(screen.getByLabelText('Paste current settings JSON'),{target:{value:'{"internal_solid_infill_pattern":"zig-zag"}'}});fireEvent.click(screen.getByRole('button',{name:'Apply current settings'}));fireEvent.click(screen.getByRole('tab',{name:'Strength'}));
 const input=screen.getByLabelText('Current Top/bottom shells Internal solid infill pattern') as HTMLInputElement;expect(input.value).toBe('Rectilinear');const row=input.closest('.setting-row')!;expect(row.querySelector('.setting-value strong')?.textContent).toBe('Rectilinear');expect(row.textContent).not.toContain('zig-zag');
});

it('shows native Filament groups and paired temperature/scarf controls',()=>{
 render(<App/>);fireEvent.click(screen.getByRole('tab',{name:'Filament'}));const panel=screen.getByRole('tabpanel');expect([...panel.querySelectorAll('.setting-group h4')].map(e=>e.textContent)).toEqual(['Basic information','Print temperature','Volumetric speed limitation','Filament scarf seam settings']);expect(screen.getByLabelText('Current Basic information Recommended nozzle temperature · Min')).toBeTruthy();expect(screen.getByLabelText('Current Print temperature Cool Plate SuperTack · Initial layer')).toBeTruthy();expect(screen.getByLabelText('Current Filament scarf seam settings Scarf seam type')).toBeTruthy();expect(screen.queryByText('Conditioning')).toBeNull();
});

describe('collapsed model panel and print-time planning',()=>{
 it('collapses and restores the complete sidebar without losing the loaded model or current values',()=>{
  render(<App/>);fireEvent.change(screen.getByLabelText('Current Layer height Layer height'),{target:{value:'0.2 mm'}});fireEvent.click(screen.getByRole('button',{name:'Collapse model panel'}));const content=document.getElementById('model-workspace-content')!;expect(content.hidden).toBe(true);expect(screen.getByRole('button',{name:'Expand model panel'}).getAttribute('aria-expanded')).toBe('false');expect(document.querySelector('.workspace.sidebar-collapsed')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Expand model panel'}));expect(content.hidden).toBe(false);expect(screen.getByText('Sample coaster')).toBeTruthy();expect((screen.getByLabelText('Current Layer height Layer height') as HTMLInputElement).value).toBe('0.2 mm');
 });
 it('shows a single time and grams, accepts a sliced time reference and switches to the efficient bottle profile',()=>{
  render(<App/>);expect(screen.getByRole('region',{name:'Estimated print time'})).toBeTruthy();expect(screen.getByLabelText('Estimated filament usage').textContent).toContain(' g');expect(document.querySelector('.time-summary strong')?.textContent).not.toContain('–');fireEvent.change(screen.getByLabelText('Current Bambu Studio time in hours'),{target:{value:'16'}});expect(screen.getAllByText('16 h').length).toBeGreaterThan(0);fireEvent.change(screen.getByLabelText('Intended use'),{target:{value:'Bottle cover / sleeve'}});fireEvent.click(screen.getByRole('button',{name:'Use Balanced bottle-cover settings'}));expect((screen.getByLabelText('Intended use') as HTMLSelectElement).value).toBe('Bottle cover / sleeve');expect(screen.getByText('0.2 mm layers')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Compare modes'}));expect(screen.getAllByText('Estimated print time').length).toBeGreaterThan(1);expect(screen.getByText('Single estimate')).toBeTruthy();
 });
 it('clears the sliced time reference when changing model and includes it in copied reports',async()=>{
  render(<App/>);fireEvent.change(screen.getByLabelText('Current Bambu Studio time in hours'),{target:{value:'16'}});fireEvent.click(screen.getByRole('button',{name:'Copy all'}));await waitFor(()=>expect(navigator.clipboard.writeText).toHaveBeenCalled());expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toContain('sliced time: 16 h');fireEvent.click(screen.getByRole('button',{name:'Tower'}));expect((screen.getByLabelText('Current Bambu Studio time in hours') as HTMLInputElement).value).toBe('');
 });
});

it('switches Speed between Main and Auxiliary with independent current values',{timeout:10000},()=>{
 render(<App/>);fireEvent.click(screen.getByRole('tab',{name:'Speed'}));
 fireEvent.change(screen.getByLabelText('Current Initial layer speed Initial layer'),{target:{value:'22'}});
 fireEvent.click(screen.getByRole('button',{name:/Auxiliary: Standard/}));
 expect((screen.getByLabelText('Current Initial layer speed Initial layer') as HTMLInputElement).value).toBe('');
 fireEvent.change(screen.getByLabelText('Current Initial layer speed Initial layer'),{target:{value:'18'}});
 fireEvent.click(screen.getByRole('button',{name:/Main: Standard/}));
 expect((screen.getByLabelText('Current Initial layer speed Initial layer') as HTMLInputElement).value).toBe('22');
 expect(screen.queryByText(/Variant-specific:/)).toBeNull();
});

it('does not show a geometry subtotal as a five-colour job total',()=>{
 render(<App/>);fireEvent.change(screen.getByLabelText('Paste current settings JSON'),{target:{value:JSON.stringify({filament_colour:['purple','pink','white','red','black'],filament_type:Array(5).fill('PETG')})}});fireEvent.click(screen.getByRole('button',{name:'Apply current settings'}));
 expect(document.querySelector('.time-summary strong')?.textContent).toMatch(/\d+ (h|min)/);
 expect(screen.queryByLabelText('Total colour / tool changes')).toBeNull();
 expect(screen.getByLabelText('Estimated filament usage').textContent).toContain('Model + supports');
 expect(screen.getByText(/Multi-colour time and grams shown cover/)).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Open browser slicer'})).toBeNull();
});
it('imports a per-plate Studio slice reference and keeps it labelled after context changes',async()=>{
 render(<App/>);const buffer=mf(xml(),{'Metadata/slice_info.config':strToU8('<config><plate><metadata key="index" value="1"/><metadata key="prediction" value="72900"/><metadata key="weight" value="211.87"/></plate></config>')});
 const file=new File([buffer],'same-model.gcode.3mf');Object.defineProperty(file,'arrayBuffer',{value:async()=>buffer});
 fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[file]}});
 await waitFor(()=>expect(document.querySelector('.time-summary strong')?.textContent).toBe('20 h 15 min'));
 expect(screen.getByLabelText('Estimated filament usage').textContent).toContain('211.87 g');
 fireEvent.click(screen.getByRole('button',{name:'Fast'}));expect(screen.getByText(/does not update when recommendations change/)).toBeTruthy();expect(document.querySelector('.time-summary strong')?.textContent).toBe('20 h 15 min');
 fireEvent.click(screen.getByRole('button',{name:'Expand model panel'}));fireEvent.click(screen.getByRole('button',{name:'Tower'}));expect(screen.queryByText(/Saved Studio plate 1/)).toBeNull();
});

it('offers a speed-quality action that clears fine detail without changing selected filament',()=>{
 render(<App/>);fireEvent.change(screen.getByLabelText('Filament family'),{target:{value:'PETG'}});fireEvent.click(screen.getByRole('button',{name:'Quality'}));
 fireEvent.click(screen.getByRole('button',{name:'Use Balanced speed + quality'}));
 expect(screen.getByRole('button',{name:'Balanced'}).getAttribute('aria-pressed')).toBe('true');expect((screen.getByLabelText('Filament family') as HTMLSelectElement).value).toBe('PETG');expect(screen.getByText('0.2 mm layers')).toBeTruthy();
});

it('keeps the full Studio library collapsed in the default streamlined workspace',()=>{
 renderApp(<App/>);expect((screen.getByText('All Studio controls & current settings').closest('details') as HTMLDetailsElement).open).toBe(false);expect(screen.getByRole('region',{name:'Recommended changes'})).toBeTruthy();expect(screen.queryByText('Shorter prints, protected visible surfaces')).toBeNull();
 fireEvent.click(screen.getByText('All Studio controls & current settings'));expect(screen.getByRole('tab',{name:'Quality'})).toBeTruthy();
});
it('automatically switches a 3MF upload from PLA to PETG and shows configured slots',async()=>{
 renderApp(<App/>);const buffer=mf(xml(),{'Metadata/project_settings.config':strToU8(JSON.stringify({filament_type:['PETG','PETG'],filament_settings_id:['Generic PETG @BBL X2D','Generic PETG @BBL X2D'],printer_model:'Bambu Lab X2D',nozzle_diameter:['0.4']}))});const file=new File([buffer],'Gengar_smartphone_holder.3mf');Object.defineProperty(file,'arrayBuffer',{value:async()=>buffer});fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[file]}});
 await waitFor(()=>expect((screen.getByLabelText('Filament family') as HTMLSelectElement).value).toBe('PETG'));
 expect((screen.getByLabelText('Intended use') as HTMLSelectElement).value).toBe('Functional');expect(screen.getByRole('region',{name:'Detected project'}).textContent).toContain('2 configured filament slots');
 fireEvent.change(screen.getByLabelText('Filament family'),{target:{value:'PLA'}});expect(screen.getByRole('region',{name:'Detected project'}).textContent).toContain('changed manually');
});

it('withholds geometry grams when a mixed-material upload has no single known density',async()=>{
 renderApp(<App/>);const buffer=mf(xml(),{'Metadata/project_settings.config':strToU8('{"filament_type":["PETG","PLA"]}')});const file=new File([buffer],'mixed.3mf');Object.defineProperty(file,'arrayBuffer',{value:async()=>buffer});fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[file]}});
 await waitFor(()=>expect((screen.getByLabelText('Filament family') as HTMLSelectElement).value).toBe('Other'));expect(screen.getByLabelText('Estimated filament usage').textContent).toContain('Material density needed');
});

it('collapses the model and detection details on successful uploads, including the same filename again',async()=>{
 renderApp(<App/>);
 const makeFile=(material:string)=>{const buffer=mf(xml(),{'Metadata/project_settings.config':strToU8(JSON.stringify({filament_type:[material]}))});const file=new File([buffer],'holder.3mf');Object.defineProperty(file,'arrayBuffer',{value:async()=>buffer});return file;};
 fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[makeFile('PETG')]}});
 await waitFor(()=>expect(document.getElementById('model-workspace-content')!.hidden).toBe(true));
 const details=screen.getByText('Detection details').closest('details')!;expect(details.open).toBe(false);
 fireEvent.click(screen.getByText('Detection details'));expect(details.open).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Expand model panel'}));expect(document.getElementById('model-workspace-content')!.hidden).toBe(false);
 fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[makeFile('PLA')]}});
 await waitFor(()=>expect((screen.getByLabelText('Filament family') as HTMLSelectElement).value).toBe('PLA'));
 expect(document.getElementById('model-workspace-content')!.hidden).toBe(true);expect(screen.getByText('Detection details').closest('details')!.open).toBe(false);
});
