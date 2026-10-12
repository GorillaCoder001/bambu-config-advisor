import {BookOpen,ExternalLink} from 'lucide-react';
const glossary=[
 ['Layer height','The vertical distance between layers. Smaller layers improve curves and fine vertical detail, with longer print times.'],
 ['Wall loops','The number of perimeter passes. More walls often improve functional strength more efficiently than adding infill; orientation and layer bonding still matter.'],
 ['Infill','The internal lattice between solid skins. Infill density does not translate directly to strength or weight.'],
 ['Top shell thickness','The minimum solid top skin. Broad flat tops need enough thickness to avoid sagging and visible infill patterns. Layer counts round up.'],
 ['Arachne','A variable-width wall generator that can preserve some narrow features. It cannot make detail smaller than the extrusion process can resolve.'],
 ['Seam position','The start/stop location of perimeters. Aligned seams concentrate marks; use seam painting to choose a less visible face.'],
 ['Scarf seam','A gradual extrusion transition at the seam. This is profile- and version-sensitive; validate flow and dimensions before enabling it.'],
 ['Support','Temporary material below unsupported regions. This tool finds candidates; the slicer decides actual support paths and where supports can reach.'],
 ['Overhang','A surface extending beyond the previous layer. Bambu threshold angle is the face slope from horizontal: smaller slopes are more demanding.'],
 ['Bridging','Extrusion crossing between supported anchors. Downward horizontal faces may be bridges or shelves; this tool cannot establish anchors or bridge length.'],
 ['Volumetric flow','Material extruded per second, approximately line width × layer height × speed. The exact filament and nozzle limit may slow down nominal process speeds.'],
 ['Cooling','Fan and slowdown logic balance solidification and layer bonding. eSUN PETG-Matte and PolyLite PETG have very different official cooling guidance.'],
 ['Ironing','A light pass over a top surface that can improve flat finishes. It adds time and can damage fine relief or uncalibrated surfaces.'],
 ['PETG vs PLA','PLA is generally easy to print and suited to indoor decoration. PETG is tougher and more moisture-sensitive; it may string and bond firmly to support/plates. Exact formulas vary.'],
 ['Fit and clearance','Check the internal cavity and mating part, not only the external bounding box. A 0.2–0.4 mm diametral-clearance coupon is an illustrative trial, not a guarantee or automatic model adjustment.']
];
export function Guide(){return <div className="reading-view"><p className="eyebrow">A SMALL PRINTING FIELD GUIDE</p><h1>Understand the setting.<br/><span>Make a better decision.</span></h1><p className="lead">Practical context for your Bambu Studio recommendations, one concept at a time.</p><div className="guide-grid">{glossary.map(([title,text])=><details key={title} className="guide-card"><summary><BookOpen size={16}/>{title}<span>+</span></summary><p>{text}</p></details>)}</div><div className="guide-links"><h3>Learn to inspect your geometry</h3><a href="https://www.autodesk.com/learn/ondemand/collection/self-paced-learning-for-fusion" target="_blank" rel="noreferrer">Autodesk Fusion learning <ExternalLink size={14}/></a><a href="https://learn.onshape.com/" target="_blank" rel="noreferrer">Onshape Learning Center <ExternalLink size={14}/></a><a href="https://github.com/OrcaSlicer/OrcaSlicer/wiki/Calibration" target="_blank" rel="noreferrer">OrcaSlicer calibration <ExternalLink size={14}/></a></div></div>;}
