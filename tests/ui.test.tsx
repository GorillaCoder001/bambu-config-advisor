// @vitest-environment jsdom
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import App from '../src/App';
import {binary} from './fixtures';
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
 it('switches tabs and exposes exact field labels',()=>{render(<App/>);fireEvent.click(screen.getByRole('tab',{name:'Strength'}));expect(screen.getByText('Wall loops')).toBeTruthy();expect(screen.getByRole('tab',{name:'Strength'}).getAttribute('aria-selected')).toBe('true');});
 it('supports keyboard tab navigation',()=>{render(<App/>);fireEvent.keyDown(screen.getByRole('tab',{name:'Quality'}),{key:'ArrowRight'});expect(screen.getByRole('tab',{name:'Strength'}).getAttribute('aria-selected')).toBe('true');});
 it('changes context and recommendations dynamically',()=>{render(<App/>);fireEvent.change(screen.getByLabelText('Intended use'),{target:{value:'Functional'}});fireEvent.click(screen.getByRole('tab',{name:'Strength'}));expect(screen.getByText('4')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Quality'}));expect(screen.getByText('0.1 mm layers')).toBeTruthy();});
 it('handles unsupported upload without losing the current model',()=>{render(<App/>);fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[new File(['bad'],'bad.obj')]}});expect(screen.getByRole('alert').textContent).toContain('Unsupported');expect(screen.getByText('Sample coaster')).toBeTruthy();});
 it('uploads a model and displays real analysis',async()=>{render(<App/>);const f=new File([binary()],'my-part.stl');Object.defineProperty(f,'arrayBuffer',{value:async()=>binary()});fireEvent.change(screen.getByLabelText('Upload STL or 3MF model'),{target:{files:[f]}});await waitFor(()=>expect(screen.getByText('my-part.stl')).toBeTruthy());expect(screen.getByText('20 × 20 × 20')).toBeTruthy();});
 it('selects an overhang sample and changes support setting',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Overhang'}));fireEvent.click(screen.getByRole('tab',{name:'Support'}));expect(screen.getByText('ON')).toBeTruthy();});
 it('copies all settings with report limitations',async()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Copy all'}));await waitFor(()=>expect(navigator.clipboard.writeText).toHaveBeenCalled());expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]).toContain('No G-code or importable preset');});
 it('exports JSON and calls print',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'JSON'}));expect(URL.createObjectURL).toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Print'}));expect(window.print).toHaveBeenCalled();});
 it('shows key comparisons without a giant table',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Compare modes'}));expect(screen.getByText('Find your balance')).toBeTruthy();expect(screen.getByRole('table')).toBeTruthy();});
 it('opens manufacturer/profile preferences and source guidance',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Filament profile & preferences'}));expect(screen.getByLabelText('Manufacturer')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Research'}));expect(screen.getByText('Official sources')).toBeTruthy();expect(screen.getByRole('link',{name:'Download full source matrix'})).toBeTruthy();});
 it('exposes print guide explanations',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Print guide'}));expect(screen.getByText('Volumetric flow')).toBeTruthy();expect(screen.getByText('Fit and clearance')).toBeTruthy();});
});
