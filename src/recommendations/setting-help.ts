import type {Analysis,Context,CurrentSettings,Setting,SettingExplanation} from '../types';
import {studioVersion} from './studio-layout';
import definitionLines from '../profiles/setting-definition-lines.json';

// Authored plain-language summaries of the pinned Studio control definitions.
// These explain control behavior, not a claim that Studio endorses our numeric rules.
const meanings:Record<string,string>={
 layer_height:'How thick each printed layer is. This mainly changes the smoothness of slopes and curves in the height direction.',
 initial_layer_print_height:'The thickness of the first layer touching the build plate.',
 line_width:'The usual width of a printed line when a more specific line-width field is left at zero.',
 seam_position:'Where a wall starts and ends. This join can leave a small visible mark on each layer.',
 seam_placement_away_from_overhangs:'Moves the wall join away from areas that have little support underneath.',
 seam_gap:'Stops a wall loop a little short of its starting point to reduce a raised seam.',
 seam_slope_conditional:'Uses a gradual scarf join on smooth wall sections while allowing ordinary joins at suitable corners.',
 scarf_angle_threshold:'The corner-angle cutoff used to decide where a smart scarf join is appropriate.',
 seam_slope_entire_loop:'Spreads the scarf join around the whole wall rather than a short section.',
 seam_slope_steps:'The minimum number of small segments used to build a gradual scarf join.',
 seam_slope_inner_walls:'Applies gradual scarf joins to the hidden inner walls as well.',
 override_filament_scarf_seam_setting:'Lets this process use its own scarf settings instead of the filament preset settings.',
 wipe_speed:'How quickly the nozzle moves during its wipe action. A percentage is relative to travel speed.',
 role_base_wipe_speed:'Uses the speed of the preceding printed feature as the reference for wiping.',
 slice_closing_radius:'Closes tiny cracks in a sliced outline. Cracks narrower than twice this radius may be filled.',
 resolution:'How closely the generated print path follows the model outline. This is a path simplification tolerance, not layer height.',
 enable_arc_fitting:'Allows curved paths to be written as arc commands rather than many short straight moves.',
 xy_hole_compensation:'Adjusts hole sizes sideways. Positive values enlarge holes; negative values make them smaller.',
 xy_contour_compensation:'Adjusts the outside outline sideways. Positive values enlarge it; negative values shrink it.',
 enable_circle_compensation:'Uses an experimental correction for small circular features with supported filament profiles.',
 circle_compensation_manual_offset:'Fine-tunes the fit produced by circle compensation. Positive tightens the fit; negative loosens it.',
 elefant_foot_compensation:'Pulls in the first-layer outline to reduce the wider rim sometimes left at the bottom.',
 precise_outer_wall:'Adjusts wall spacing to improve the outside dimensions and consistency between layers.',
 precise_z_height:'Fine-tunes the last few layer heights to better match the requested overall height.',
 ironing_type:'Makes an extra nozzle pass with a small amount of plastic over selected flat top surfaces.',
 wall_generator:'Chooses fixed-width walls (Classic) or walls whose width can change to fit features (Arachne).',
 wall_transition_angle:'Controls which pointed shapes allow Arachne to change the number of walls.',
 wall_transition_filter_deviation:'Limits repeated switching between an extra wall and one fewer wall.',
 wall_transition_length:'The distance used to join or split wall paths when the wall count changes.',
 wall_distribution_count:'How many inner walls share Arachne line-width adjustments.',
 min_bead_width:'The narrowest line Arachne uses to print a retained thin feature.',
 min_feature_size:'The cutoff below which Arachne can omit features that are too thin.',
 wall_sequence:'Chooses whether the hidden inner walls or the visible outer wall print first.',
 is_infill_first:'Chooses whether internal infill prints before the walls.',
 bridge_flow:'Adjusts the amount of plastic used for lines crossing a gap in mid-air.',
 thick_bridges:'Uses thicker bridge lines to improve spanning ability, with a rougher-looking underside as a possible cost.',
 counterbore_hole_bridging:'Adds special bridge paths for recessed holes, potentially using sacrificial material that must be removed.',
 print_flow_ratio:'Scales the plastic amount for this object or process in addition to filament flow settings.',
 top_solid_infill_flow_ratio:'Scales the plastic amount used for solid top fill.',
 initial_layer_flow_ratio:'Scales the plastic amount used for the first layer.',
 top_one_wall_type:'Uses only one wall around selected top surfaces so there is more room for top fill.',
 top_area_threshold:'The minimum top-area width used by the one-wall-on-top rule.',
 only_one_wall_first_layer:'Uses just one wall loop on the first layer.',
 detect_overhang_wall:'Finds wall sections that extend beyond the layer below and applies the relevant overhang behavior.',
 smooth_speed_discontinuity_area:'Adds gradual speed changes where neighboring print regions would otherwise switch speed abruptly.',
 smooth_coefficient:'Adjusts how long a gradual speed transition is. Smaller values stretch the transition; zero disables it.',
 reduce_crossing_wall:'Lets travel moves take a detour around walls to reduce marks and blobs.',
 max_travel_detour_distance:'Limits how much extra travel is allowed when avoiding a wall crossing.',
 avoid_crossing_wall_includes_support:'Includes support structures when planning travel detours around walls.',
 z_direction_outwall_speed_continuous:'Smooths outer-wall speed changes between layers to reduce visible finish bands.',
 wall_loops:'The number of printed outlines making up the sides of the part.',
 alternate_extra_wall:'Adds an extra wall on alternating layers to help the wall and infill join.',
 embedding_wall_into_infill:'Connects walls into neighboring infill regions where normal wall loops are absent.',
 detect_thin_wall:'Lets Classic print some narrow walls as a single line rather than leaving them out.',
 interface_shells:'Creates solid boundaries between adjacent material regions.',
 top_shell_layers:'The minimum number of solid layers used to close the top of the part.',
 top_shell_thickness:'The minimum thickness of the solid top skin. Studio can add layers to meet this thickness.',
 bottom_shell_layers:'The minimum number of solid layers at the bottom, including the first layer.',
 bottom_shell_thickness:'The minimum thickness of the solid bottom skin. Studio can add layers to meet this thickness.',
 top_color_penetration_layers:'How many layers a color painted on the top extends into the model.',
 bottom_color_penetration_layers:'How many layers a color painted on the bottom extends into the model.',
 infill_instead_top_bottom_surfaces:'Uses the infill pattern in place of ordinary solid top and bottom surfaces.',
 sparse_infill_density:'How much of the interior is filled with an internal support pattern where there is room for infill.',
 sparse_infill_pattern:'The shape of the internal infill structure.',
 fill_multiline:'Uses several adjacent lines for supported infill patterns.',
 conformal_infill:'Makes supported infill patterns follow each layer outline rather than one fixed set of straight directions.',
 conformal_stagger:'Controls how neighboring layers of conformal infill connect or offset.',
 conformal_link_keep_layers:'How many consecutive layers keep the forward conformal infill direction.',
 conformal_link_flip_layers:'How many consecutive layers reverse the conformal infill direction. Zero disables reversal.',
 conformal_pole:'Chooses how the center of radial conformal infill follows the shape through its height.',
 conformal_ray_count:'Sets the count of radial infill lines. Zero lets Studio derive the count from infill density.',
 conformal_hub_radius:'The size of the center region using ordinary straight infill instead of radial infill.',
 locked_skin_infill_pattern:'The infill pattern in the outer skin region of a locked infill structure.',
 skin_infill_density:'How densely the outer skin region of a locked infill structure is filled.',
 locked_skeleton_infill_pattern:'The infill pattern in the interior skeleton region of a locked infill structure.',
 skeleton_infill_density:'How densely the interior skeleton region of a locked infill structure is filled.',
 infill_lock_depth:'How far the locked skin and interior infill regions overlap.',
 skin_infill_depth:'How far the locked skin region extends inward from the surface.',
 skin_infill_line_width:'The printed line width in the locked skin region.',
 skeleton_infill_line_width:'The printed line width in the locked interior region.',
 symmetric_infill_y_axis:'Mirrors the infill texture for parts arranged symmetrically around the Y axis.',
 infill_shift_step:'Moves the infill pattern slightly sideways between layers to alter its texture.',
 infill_rotate_step:'Rotates the infill pattern slightly between layers to alter its texture.',
 sparse_infill_anchor:'Adds short connections from sparse infill to an inner wall to help the infill stay attached.',
 sparse_infill_anchor_max:'The longest allowed wall connection for sparse infill anchors.',
 filter_out_gap_fill:'Skips gap-fill regions below a size threshold.',
 infill_wall_overlap:'Makes infill overlap the walls slightly so they join together.',
 monotonic_travel_into_wall:'Extends travel between monotonic fill lines to improve their join with the wall.',
 infill_direction:'The starting direction of the internal infill lines.',
 bridge_angle:'Overrides the direction of bridge lines. Zero lets Studio choose the direction.',
 minimum_sparse_infill_area:'Replaces small sparse-infill regions with solid fill.',
 infill_combination:'Combines several infill layers into a thicker pass while walls keep their ordinary layer height.',
 detect_narrow_internal_solid_infill:'Uses a different fill layout in narrow solid regions to reduce unnecessary path changes.',
 ensure_vertical_shell_thickness:'Adds solid fill beside sloping surfaces to maintain the shell thickness.',
 detect_floating_vertical_shell:'Finds unsupported shell paths and slows them to bridge speed.',
 small_perimeter_threshold:'The size cutoff for applying small-perimeter speed.',
 small_perimeter_speed:'The speed used for short wall loops. A percentage is relative to outer-wall speed.',
 vertical_shell_speed:'A speed limit for relevant vertical-shell regions, expressed relative to their normal speed when entered as a percentage.',
 enable_overhang_speed:'Slows wall sections that have less support from the layer below.',
 enable_height_slowdown:'Reduces speed and acceleration progressively as the print gets taller.',
 slowdown_start_height:'The height where the gradual slowdown starts.',
 slowdown_end_height:'The height where the final reduced speed and acceleration are reached.',
 slowdown_start_speed:'The speed at the beginning of height-based slowdown.',
 slowdown_end_speed:'The speed at the end of height-based slowdown.',
 slowdown_start_acc:'The acceleration at the beginning of height-based slowdown.',
 slowdown_end_acc:'The acceleration at the end of height-based slowdown.',
 accel_to_decel_enable:'Enables the acceleration-to-deceleration limit used by the supported motion system.',
 accel_to_decel_factor:'Sets the factor for the acceleration-to-deceleration limit.',
 enable_support:'Adds temporary printed structures under areas that cannot print reliably in mid-air.',
 support_type:'Chooses normal or branching tree supports, and automatic placement or manually painted support areas.',
 support_style:'The layout of the selected support type, such as more compact or more stable structures.',
 support_threshold_angle:'The face-slope cutoff for support generation, measured from horizontal. A larger value can request more supports.',
 support_on_build_plate_only:'Only allows supports that start on the build plate, not on another part of the model.',
 support_critical_regions_only:'Restricts automatic support to selected risky areas such as projecting tips.',
 support_remove_small_overhang:'Lets Studio omit small overhangs it judges unlikely to need support.',
 raft_layers:'Adds a printed platform under the part and raises the model above the build plate.',
 raft_contact_distance:'The vertical gap between the raft and the part.',
 support_filament:'The filament used for the main support structure and raft.',
 support_interface_filament:'The filament used where the support meets the part.',
 support_interface_not_for_body:'Keeps the selected interface material out of the main support body where possible.',
 enable_support_ironing:'Adds a smoothing pass over a compatible solid support or raft interface.',
 raft_first_layer_density:'How densely the first layer of the raft or support footprint is filled.',
 raft_first_layer_expansion:'Expands the first raft or support footprint for better bed contact. Minus one lets Studio choose.',
 tree_support_wall_count:'The number of walls around tree supports. Minus one lets Studio choose; zero allows infill-only regions where suitable.',
 support_top_z_distance:'The vertical gap between the top of a support and the underside of your part.',
 support_bottom_z_distance:'The vertical gap below a support that starts on top of the model.',
 support_base_pattern:'The line layout in the main support structure.',
 support_base_pattern_spacing:'The space between lines in the main support body.',
 support_angle:'Rotates the support line pattern across the build plate.',
 support_interface_top_layers:'The number of denser support layers just below the part.',
 support_interface_bottom_layers:'The number of denser layers at a support resting on the model.',
 support_interface_pattern:'The line layout in the denser contact layer between support and part.',
 support_interface_spacing:'The space between lines at the top support interface. Zero creates a solid interface.',
 support_bottom_interface_spacing:'The space between lines at the bottom support interface. Zero creates a solid interface.',
 support_expansion:'Widens or narrows the horizontal footprint of normal supports.',
 support_object_xy_distance:'The sideways gap between a support and the part.',
 top_z_overrides_xy_distance:'Prioritizes the top vertical gap over the ordinary sideways support gap in relevant support regions.',
 support_object_first_layer_gap:'The sideways gap between the model and supports on the first layer.',
 bridge_no_support:'Allows eligible bridge regions to print without support underneath.',
 max_bridge_length:'The longest bridge allowed without support by this rule. Zero requests support for all eligible bridges.',
 independent_support_layer_height:'Lets support layers use a different height from the model layers. Studio disables this with a prime tower.',
 tree_support_branch_distance:'The distance between neighboring tree-support contact points.',
 tree_support_branch_diameter:'The starting thickness of tree-support branches.',
 tree_support_branch_angle:'How far tree branches may lean sideways to reach an overhang.',
 tree_support_branch_diameter_angle:'How quickly tree branches thicken toward their base.',
 skirt_loops:'Adds separate outline loops around the part without attaching them to it. Zero turns the skirt off.',
 skirt_height:'The number of layers over which the skirt is printed.',
 skirt_distance:'The distance between the skirt and the part or its brim.',
 brim_type:'Chooses where to attach a thin removable border around the base of the part.',
 brim_width:'How far that removable border extends outward from the part.',
 brim_object_gap:'The gap between the part and its brim, used to make the brim easier to remove.',
 enable_prime_tower:'Adds a separate tower for preparing extrusion after relevant material or tool changes.',
 prime_tower_skip_points:'Skips selected wall starting points along the tower wipe path.',
 prime_tower_enable_framework:'Adds an internal framework to stabilize the prime tower.',
 prime_tower_width:'The width of the separate priming tower.',
 prime_tower_max_speed:'The tower printing-speed limit, excluding ramming.',
 prime_tower_brim_width:'The tower brim width. Negative values ask Studio to calculate it from tower height.',
 prime_tower_infill_gap:'The spacing used inside the priming tower.',
 prime_tower_rib_wall:'Adds external reinforcing ribs around the priming tower.',
 prime_tower_extra_rib_length:'Adjusts the length of the reinforcing ribs on the priming tower.',
 prime_tower_rib_width:'The width of the priming tower reinforcing ribs.',
 prime_tower_fillet_wall:'Rounds the corners of the priming tower wall.',
 enable_tower_interface_features:'Uses dedicated preparation settings at tower layers where different materials meet.',
 wipe_tower_no_sparse_layers:'Skips tower layers without tool changes, requiring safe downward travel to the tower later.',
 flush_into_infill:'Puts some material flushed during changes inside the internal infill instead of discarding it.',
 flush_into_objects:'Uses a designated object to take flushed material during changes, mixing its colors.',
 flush_into_support:'Puts some flushed material into supports when the required tower setup is enabled.',
 slicing_mode:'Changes how Studio interprets and closes model outlines. Special modes can fill holes you intended to keep.',
 print_sequence:'Chooses to print all objects layer by layer or finish one object before starting the next.',
 spiral_mode:'Creates a continuous single-wall vase-style print from a suitable model, with bottom layers.',
 spiral_mode_smooth:'Smooths sideways motion as well as the height changes in a spiral print.',
 spiral_mode_max_xy_smoothing:'Limits how far sideways spiral smoothing may move the print path.',
 timelapse_type:'Chooses how print-progress photos are captured to create a time-lapse video.',
 fuzzy_skin:'Adds deliberate texture to selected walls rather than a smooth outer finish.',
 fuzzy_skin_mode:'Chooses whether texture comes from sideways path changes, varying extrusion, or both.',
 fuzzy_skin_noise_type:'Chooses the random or patterned texture used by fuzzy skin.',
 fuzzy_skin_point_distance:'The average spacing between fuzzy-skin path points.',
 fuzzy_skin_thickness:'How far fuzzy-skin texture may project sideways from the original wall.',
 fuzzy_skin_scale:'The size of the larger features in a patterned fuzzy texture.',
 fuzzy_skin_octaves:'The number of detail scales combined in a patterned fuzzy texture.',
 fuzzy_skin_persistence:'How much finer detail contributes to a patterned fuzzy texture.',
 fuzzy_skin_first_layer:'Applies the fuzzy texture to the first layer as well.',
 enable_wrapping_detection:'Enables the compatible printer feature for detecting clumped or wrapped material.',
 enable_order_independent_overlap_carving:'Changes how overlapping model parts are kept or cut away, using their bounding-box sizes.',
 interlocking_beam:'Adds interlocking structures at boundaries between different filaments to help them join.',
 mmu_segmented_region_interlocking_depth:'How far interlocking extends into a segmented material region. Zero disables this feature.',
 interlocking_beam_width:'The width of the internal beams joining material regions.',
 interlocking_orientation:'The direction of the internal beams joining material regions.',
 interlocking_beam_layer_count:'The beam height in layers at a material boundary.',
 interlocking_depth:'How far the interlocking structure extends inward from a material boundary, measured in cells.',
 interlocking_boundary_avoidance:'How far interlocking stays away from the outside of the model, measured in cells.',
 sparse_infill_filament:'The filament assigned to sparse internal fill.',
 solid_infill_filament:'The filament assigned to solid internal fill.',
 wall_filament:'The filament assigned to the printed walls.',
 reduce_infill_retraction_mode:'Chooses whether to skip filament pull-back on travel inside infill, based on the material behavior.',
 gcode_add_line_number:'Adds line numbers to exported printer commands for compatible workflows.',
 exclude_object:'Adds object-exclusion commands for a compatible firmware workflow.',
 filename_format:'The template for naming the exported print file.',
 filament_type:'The material family recorded in the filament preset.',
 filament_vendor:'The manufacturer recorded in the filament preset.',
 filament_soluble:'Marks the filament as a soluble material for supported workflows.',
 filament_is_support:'Marks the filament as a dedicated support material.',
 impact_strength_z:'A recorded material property for impact resistance through the layer direction; it does not strengthen the print by itself.',
 required_nozzle_HRC:'The minimum nozzle hardness required by this filament. Zero disables this check.',
 default_filament_colour:'The default color shown for this filament in Studio.',
 filament_diameter:'The physical filament thickness Studio uses to calculate how much filament to feed.',
 filament_adhesiveness_category:'A preset category describing material adhesion behavior.',
 filament_metal_stickiness:'How readily the material sticks to a metal nozzle; this influences supported retraction optimizations.',
 filament_flow_ratio:'Scales how much plastic is pushed out. It is an extrusion calibration value, not a print-speed setting.',
 enable_pressure_advance:'Enables a custom pressure-advance override for supported non-Bambu workflows.',
 pressure_advance:'The pressure compensation factor for supported non-Bambu firmware.',
 filament_density:'The material density used to estimate weight and cost, not to change the printed shape.',
 filament_shrink:'The retained-size percentage after cooling, used for sideways size compensation. It is not the percentage lost: 94% means 94 mm remains from 100 mm.',
 filament_velocity_adaptation_factor:'A material factor used with speed smoothing to control transition length.',
 filament_cost:'Your actual filament price per kilogram for cost estimates.',
 temperature_vitrification:'The material softening temperature recorded for printer heat-management guidance, not the nozzle printing temperature.',
 filament_printable:'Records whether this material can be used by the selected extruder.',
 filament_cooling_before_tower:'The temperature drop requested before entering the priming tower.',
 filament_tower_interface_pre_extrusion_dist:'The movement distance used for pre-extrusion at a material boundary in the priming tower.',
 filament_tower_interface_pre_extrusion_length:'The amount of filament fed for pre-extrusion at a tower material boundary.',
 filament_tower_ironing_area:'The area smoothed at a material boundary in the priming tower.',
 filament_tower_interface_purge_volume:'The purge amount configured at a material boundary in the priming tower.',
 filament_tower_interface_print_temp:'The temperature used at a tower material boundary. Minus one uses the maximum recommended nozzle temperature.',
 nozzle_temperature_range_low:'The lower end of the filament preset recommended nozzle-temperature range; it does not directly set printing temperature.',
 nozzle_temperature_range_high:'The upper end of the filament preset recommended nozzle-temperature range; it does not directly set printing temperature.',
 nozzle_temperature_initial_layer:'The nozzle temperature used while printing the first layer.',
 nozzle_temperature:'The nozzle temperature used after the first layer.',
 chamber_temperatures:'The target enclosure temperature on a printer with chamber control. Zero disables chamber heating.',
 filament_adaptive_volumetric_speed:'Adds a fitted flow limit based on line width and layer height alongside the maximum flow setting.',
 filament_max_volumetric_speed:'The maximum volume of plastic the selected filament and nozzle heater can reliably deliver each second. It can limit actual print speed.',
 close_fan_the_first_x_layers:'The number of starting layers that use the special first-layer part-fan setting.',
 first_x_layer_part_fan_speed:'The part-cooling fan speed used during those starting layers.',
 full_fan_speed_layer:'The layer where the part fan reaches its normal target after the starting-layer ramp.',
 fan_min_speed:'The minimum part-fan speed used by the normal layer-time cooling rule.',
 fan_max_speed:'The maximum part-fan speed used by the normal layer-time cooling rule.',
 fan_cooling_layer_time:'A layer-time threshold used to bring in more part-fan cooling as layers get quicker.',
 slow_down_layer_time:'The layer-time threshold used to request slower printing for better cooling.',
 reduce_fan_stop_start_freq:'Keeps the part fan running at least at its minimum speed instead of repeatedly stopping it.',
 slow_down_for_layer_cooling:'Slows suitable print moves when a layer would finish too quickly to cool.',
 no_slow_down_for_cooling_on_outwalls:'Excludes visible outer walls from the cooling slowdown to help keep their finish consistent.',
 cooling_slowdown_logic:'Chooses whether cooling slows all features together or prioritizes hidden interior features.',
 cooling_perimeter_transition_distance:'The distance used to restore normal speed gradually before leaving a slowed wall path.',
 slow_down_min_speed:'The slowest speed the cooling slowdown rule is allowed to request.',
 enable_overhang_bridge_fan:'Enables a separate part-fan speed for unsupported overhangs and bridges.',
 overhang_fan_threshold:'The unsupported-line percentage that triggers special overhang cooling.',
 overhang_threshold_participating_cooling:'The overhang cutoff used to include regions in layer-cooling slowdown.',
 overhang_fan_speed:'The special part-fan speed for qualifying overhangs and bridges.',
 pre_start_fan_time:'Starts raising the fan speed early so it can reach the target before an overhang.',
 ironing_fan_speed:'A separate part-fan speed during ironing. Minus one leaves this override disabled.',
 close_additional_fan_first_x_layers:'The number of starting layers using a special auxiliary-fan speed.',
 first_x_layer_fan_speed:'The auxiliary side-fan speed during the starting layers; this is separate from the nozzle part fan.',
 additional_fan_full_speed_layer:'The layer where the auxiliary fan finishes ramping to its normal target.',
 additional_cooling_fan_speed:'The normal speed of the auxiliary side fan, where that fan is fitted.',
 activate_air_filtration:'Enables the supported air-filtration feature.',
 during_print_exhaust_fan_speed:'The enclosure exhaust-fan speed while printing, overriding relevant filament G-code fan settings.',
 complete_print_exhaust_fan_speed:'The enclosure exhaust-fan speed after printing finishes.'
};

const features:Record<string,string>={initial_layer:'the first-layer outlines',initial_layer_infill:'the first-layer fill',outer_wall:'the visible outside walls',inner_wall:'the hidden inner walls',top_surface:'the visible top surface',sparse_infill:'the sparse internal fill',internal_solid_infill:'the solid internal fill',gap_infill:'small gaps between printed regions',bridge:'lines spanning a gap',support:'the main temporary support structure',support_interface:'the denser support contact layers',travel:'moves without printing plastic',default:'ordinary moves without a more specific setting',initial_layer_travel:'travel on the first layer',travel_short_distance:'short travel moves'};
export function settingMeaning(s:Pick<Setting,'key'|'name'>):string|null {
 const k=s.key;if(meanings[k])return meanings[k];
 if(k.endsWith('_line_width'))return 'The width of each printed line for '+(features[k.replace(/_line_width$/,'')]||s.name.toLowerCase())+'.';
 if(k.endsWith('_surface_pattern')||k==='internal_solid_infill_pattern'||k==='sub_top_surface_pattern')return 'The direction and layout of '+(k.startsWith('bottom')?'bottom skin lines':k.startsWith('top')?'visible top skin lines':k.startsWith('sub_top')?'solid lines just below the visible top':'solid interior fill lines')+'.';
 if(k.endsWith('_surface_density'))return 'How completely the '+(k.startsWith('top')?'top':'bottom')+' skin is filled. At 100%, Studio requests a solid surface.';
 if(k.startsWith('overhang_')&&k.endsWith('_speed'))return 'The requested wall speed for the '+s.name+' unsupported-line category. These percentages describe line width hanging beyond the layer below, not face angles.';
 if(k.endsWith('_acceleration'))return 'How quickly '+(features[k.replace(/_acceleration$/,'')]||s.name.toLowerCase())+' build up or lose speed. It is different from the top speed.';
 if(k.endsWith('_jerk'))return 'The supported motion-system limit on abrupt speed changes for '+(features[k.replace(/_jerk$/,'')]||s.name.toLowerCase())+'. Use the matching machine preset.';
 if(k.endsWith('_speed')&&features[k.replace(/_speed$/,'')])return 'The requested speed for '+features[k.replace(/_speed$/,'')]+'. Short paths, cooling, flow limits and machine limits can make actual speed lower.';
 if(/^(superta[c]?k|cool|eng|hot|textured)_plate_temp/.test(k))return 'The bed temperature for '+s.name+' on the '+({supertack:'Cool Plate SuperTack',cool:'original Cool Plate',eng:'Engineering Plate',hot:'Smooth PEI / High Temp',textured:'Textured PEI'} as Record<string,string>)[k.split('_')[0]]+'. Only use the row for the plate fitted to your printer; zero means unsupported by that profile.';
 if(k.startsWith('ironing_')||k.startsWith('support_ironing_')){
  const part=k.startsWith('support_')?'support contact surface':'top surface',term=k.replace(/^support_/,'');
  return ({ironing_pattern:'The path layout of the smoothing pass over the '+part+'.',ironing_speed:'How quickly the nozzle moves during the smoothing pass over the '+part+'.',ironing_flow:'The small plastic amount used during the smoothing pass, relative to ordinary layer extrusion.',ironing_spacing:'The distance between neighboring lines of the smoothing pass.',ironing_inset:'How far the smoothing pass stays away from the surface edge.',ironing_direction:'The direction of the smoothing lines relative to the top fill.'} as Record<string,string>)[term]||null;
 }
 if(k.startsWith('seam_slope_')||k.startsWith('filament_scarf_')){
  const term=k.replace(/^seam_slope_|^filament_scarf_/,'');return ({type:'Chooses a gradual scarf join intended to make the wall seam less noticeable.',seam_type:'Chooses a gradual scarf join intended to make the wall seam less noticeable.',start_height:'The starting height of the gradual scarf join, in millimeters or a percentage of layer height.',height:'The starting height of the gradual scarf join, in millimeters or a percentage of layer height.',gap:'The shortening applied to wall paths at a scarf join to reduce a raised seam.',min_length:'The distance used for the gradual scarf join. Zero disables its length.',length:'The distance used for the gradual scarf join. Zero disables its length.'} as Record<string,string>)[term]||null;
 }
 if(k.startsWith('filament_prime_volume'))return 'The plastic volume used to prepare extrusion '+(k.endsWith('_nc')?'after a hotend change':'for the relevant extruder change')+' on the priming tower.';
 if(k.startsWith('filament_change_length'))return 'The filament feed length used before '+(k.endsWith('_nc')?'a hotend change':'an extruder change')+' to manage nozzle oozing.';
 if(k.startsWith('filament_ramming_travel_time'))return 'The reverse-travel time after ramming '+(k.endsWith('_nc')?'for a hotend change':'for an extruder change')+' to help manage oozing.';
 if(k.startsWith('filament_pre_cooling_temperature'))return 'The nozzle cooldown target during ramming '+(k.endsWith('_nc')?'for a hotend change':'for an extruder change')+'. Zero disables it; the nozzle may not reach the target before the change.';
 if(k.startsWith('filament_ramming_volumetric_speed'))return 'The flow limit for ramming before '+(k.endsWith('_nc')?'a hotend change':'an extruder change')+'. Minus one uses the filament maximum flow; it does not mean a negative flow.';
 if(k.startsWith('sparse_infill_lattice_angle_'))return 'The angle from vertical of the '+(k.endsWith('_1')?'first':'second')+' set of lattice infill elements.';
 if(k.startsWith('max_volumetric_extrusion_rate_slope_'))return 'Limits how quickly extrusion flow '+(k.endsWith('positive')?'increases':'decreases')+' when the Studio pressure-equalizer feature is available.';
 return null;
}

const advice:Record<Setting['tab'],{tradeoff:string;check:string}>={
 Quality:{tradeoff:'A smoother finish can require more print time. Size corrections and extrusion changes can also affect fit.',check:'Inspect wall paths and thin details in Preview, then print a small sample of the visible surface or mating edge.'},
 Strength:{tradeoff:'More plastic can improve some strength and surface coverage, but increases weight and time. Layer direction still matters.',check:'Inspect the sliced wall count and top coverage. Test a sample in the direction it will be loaded.'},
 Speed:{tradeoff:'Higher speed can shorten suitable moves, but may worsen ringing, roughness or extrusion. Very short paths may never reach it.',check:'In Studio Preview, compare Speed and Flow views. Test a visible wall before increasing speed.'},
 Support:{tradeoff:'More support improves some undersides but uses material, takes time and can leave removal marks.',check:'Inspect exactly where support touches the part and whether you can remove it. Print a small underside test first.'},
 Others:{tradeoff:'Preparation and special modes can change time, material use or the model outline.',check:'Review the complete sliced plate, including borders, towers and travel clearance, before printing.'},
 Filament:{tradeoff:'Values belong to the exact material, nozzle and printer. Copying them from another product can cause poor extrusion or adhesion.',check:'Match the spool, nozzle, extruder and installed plate. Keep a working calibration and test changes individually.'},
 Cooling:{tradeoff:'More cooling can reduce drooping but may weaken layer bonding or lift the part from the plate. Slower cooling moves add time.',check:'Test a small bridge and thin feature. Check layer time and actual speed in Preview before lowering cooling slowdown.'}
};

export function explainSetting(s:Setting,a:Analysis,c:Context,current?:CurrentSettings|null,settings:Setting[]=[],maxFlow?:number|null):Setting {
 const meaning=settingMeaning(s)||'An advanced '+s.group.toLowerCase()+' control. Its correct value depends on the selected Studio workflow.';
 const base=advice[s.tab];let tradeoff=base.tradeoff,check=base.check,why=s.reason;
 const k=s.key;
 if(s.intent==='retain')why='Keep '+(current?.values[k]?'your current value':'the matching '+(s.tab==='Filament'||s.tab==='Cooling'?'filament':'process')+' preset value')+'. The model does not provide the calibration or workflow evidence needed to choose a replacement.';
 if(k==='layer_height'){
  const layers=Math.max(1,Math.ceil(a.height/parseFloat(s.value)));
  why=c.priority+' with a '+c.nozzle+' mm nozzle gives '+s.value+' as an advisor starting point'+(c.detail||c.use==='Figurine'?' for your fine-detail request':c.use==='Bottle cover / sleeve'?' for your bottle cover':'')+'. At '+a.height.toFixed(1)+' mm tall, that is roughly '+layers.toLocaleString()+' layers before first-layer or variable-layer adjustments.';
  tradeoff='Thinner layers improve slopes in the height direction but add layers and time. They do not make tiny sideways text narrower or fix bottle clearance.';check='Compare this with a thicker-layer slice. Keep the nozzle and actual filament profile the same; check the surface and Studio time estimate.';
 }
 if(k==='initial_layer_print_height')why=s.value+' is half of your '+c.nozzle+' mm nozzle diameter: an advisor starting point for bed contact. Keep a proven first-layer setup if it already sticks well.';
 if((k.endsWith('_line_width')||k==='line_width')&&s.intent!=='retain')why=s.value+' is scaled from your '+c.nozzle+' mm nozzle as an advisor starting width. Studio may adjust actual widths and spacing, especially with Arachne.';
 if(k==='wall_loops'){why=s.value+' wall loops are suggested for '+c.use.toLowerCase()+(c.strong||c.priority==='Maximum strength'?' and your strength preference':'. This balances side-wall material and print time')+'. This does not measure or redesign the model wall thickness.';tradeoff='More walls usually help the sides carry load, but take time and can leave less room for infill. Wall spacing overlaps, so wall count × line width is only a rough thickness guide.';}
 if(k==='sparse_infill_density'){why=s.value+' is the advisor starting density for '+c.use.toLowerCase()+'. It fills only eligible interior regions; a narrow hollow cover wall may already be made almost entirely from wall lines.';tradeoff='Reducing infill can save time in thick interior regions. It may save very little in a thin cover and can make broad top skins harder to close.';}
 const value=(key:string)=>settings.find(row=>row.key===key)?.value||'the matching preset value';
 if(k==='top_shell_layers')why=s.value+' layers = '+value('top_shell_thickness')+' target ÷ '+value('layer_height')+' per layer, rounded up. Studio can add layers where its thickness rules require it.';
 if(k==='bottom_shell_layers')why=s.value+' layers meet the '+value('bottom_shell_thickness')+' bottom target, starting with a '+value('initial_layer_print_height')+' first layer and then '+value('layer_height')+' layers.';
 if(k==='support_top_z_distance'){tradeoff='A larger gap helps supports break off, but the underside can sag more. A smaller gap improves contact but can fuse same-material supports to the part.';why=s.value+' is an advisor trial gap for same-material '+c.material+' supports at the recommended layer height. It is not a universal removal setting.';check='Print a small support test. Confirm the actual gap in Preview: Studio may round it depending on support layer heights. Use a separate verified setup for a different interface material.';}
 if(k==='support_threshold_angle'){why=s.value+' is an advisor trial cutoff, not a measured maximum your filament can bridge. Studio supports faces flatter than this threshold from horizontal.';tradeoff='Increasing this angle can generate more support. The percentages in the Speed overhang table use a different measurement.';}
 if(k==='enable_support'){why=a.normalReliability?(s.value==='ON'?a.overhangPercent.toFixed(1)+'% of measured surface area is flagged as a possible unsupported underside. Turn supports on for review; the tool cannot prove bridge reach or support accessibility.':'No substantial risky underside was flagged in this orientation. Confirm unsupported islands and bridges in Studio before leaving supports off.'):'The mesh face directions are unreliable, so supports are enabled for review rather than assuming the part can print unsupported.';}
 if(k==='ironing_type'){tradeoff='Ironing adds a second pass and can smear small details or leave ridges if flow is wrong. It only helps suitable flat tops, not the curved sides of a bottle cover.';check='Compare the ironing time in Studio with a normal top finish. Print a small flat patch before enabling it for a full model.';}
 if(k==='filament_shrink'){tradeoff='The setting rescales sideways dimensions. An unmeasured correction can make a bottle cover or mating hole fit worse.';check='Measure a printed calibration part after cooling. Do not enter a generic shrinkage percentage as the retained-size value.';}
 if(k==='filament_flow_ratio'){tradeoff='Too much plastic can leave ridges; too little can leave gaps and weak lines. Changing flow also affects dimensions.';check='Keep your working flow calibration or run the printer-supported flow calibration for this exact filament.';}
 if(k==='elefant_foot_compensation'||k==='xy_hole_compensation'||k==='xy_contour_compensation'){tradeoff='Changing this can improve one measured fit and spoil another. A model file alone does not measure the printed error.';check='Print and measure a fit coupon with your plate, filament and first-layer settings before changing the offset.';}
 if(s.tab==='Cooling'&&(k==='fan_min_speed'||k==='fan_max_speed')){tradeoff='These are normal layer-time fan limits, not a command to use the same fan speed everywhere. First-layer and bridge cooling have separate controls.';}
 if(k==='brim_width')why=s.value+' is an advisor starting border for '+(a.aspect>3?'a tall, narrow shape':a.contactArea/Math.max(a.footprint,1)<.08?'a small measured bed-contact area':'a material with a higher lifting risk')+'. Check that it fits on the plate and can be removed.';
 if(s.tab==='Speed'&&s.intent!=='retain'){
  if(k.endsWith('_acceleration'))why=s.value+' is an advisor motion starting point for '+c.priority.toLowerCase()+(a.aspect>3?' with a tall model':'')+'. Lower settings on visible surfaces and the first layer help limit vibration or bed-contact disturbance; your machine limits still apply.';
  if(k.endsWith('_speed')&&features[k.replace(/_speed$/,'')]&&k!=='travel_speed'&&k!=='bridge_speed'){
   why=s.value+' is the advisor starting speed for '+c.priority.toLowerCase()+' and '+c.material+'. '+(maxFlow&&maxFlow>0?'Ordinary extrusion speeds are capped using '+maxFlow+' mm³/s maximum flow, '+value('layer_height')+' layers and the suggested line widths, with a 10% margin. This uses a simple width × height approximation.':'There is no single verified flow limit for this selection, so this is a requested speed, not proof the nozzle can melt plastic fast enough.')+' Studio can slow it further.';
   if(k.startsWith('initial_layer'))why=s.value+' is a slower first-layer starting speed to help plastic stick to the plate. Any known flow cap uses the first-layer height and width, rather than the normal layer height.';
  }
 }
 if(k==='seam_position'){why='Aligned puts layer joins in a consistent location, making them easier to hide on the back of the part. Paint the seam in Studio if the default location falls on a visible face.';tradeoff='An aligned seam can form a visible vertical line. A random seam spreads small marks around the surface instead.';}
 if(k==='wall_generator'){why=s.value==='Arachne'?'Your fine-detail request favors a trial of variable-width walls so more narrow features may fit. The tool has not measured every local wall thickness.':'Classic is the advisor baseline for regular walls. Keep an already successful Arachne setup if it preserves your details better.';tradeoff='Arachne can fit narrow features but changes line widths. Classic has steadier widths but may use gap fill or omit very small features.';}
 if(k==='resolution'){why=s.value+' is an advisor outline tolerance for '+(c.detail||c.use==='Figurine'?'your detail request':'general use')+'. It controls path simplification, not the physical accuracy the printer is guaranteed to achieve.';tradeoff='Smaller values preserve more outline points but can increase slicing and file size. A huge triangle count does not by itself justify a tiny tolerance.';}
 if(k==='wall_sequence')why=s.value==='outer/inner'?'Your dimensional-accuracy preference suggests an outer-first trial. Confirm overhangs because the visible wall loses some backing from already printed inner walls.':'Inner-first provides backing before the visible outside wall prints. Check whether this order gives the finish and measured fit you need.';
 if(k==='sparse_infill_pattern')why=s.value==='Gyroid'?'Gyroid is an advisor starting pattern for your functional or strength preference. Its internal paths change direction through the height; this does not certify the part for a particular load.':'Cubic is an advisor general-purpose internal structure. Keep a successful preset pattern if the sliced support under your top skins is already adequate.';
 if(k==='support_type')why='The '+s.value+' choice is based on your '+c.use.toLowerCase()+' use, not a simulated support toolpath. Compare tree and normal supports in Studio; choose the option that supports the underside and can be removed.';
 if(k==='support_interface_top_layers')why=s.value+' denser contact layers are an advisor trial to support the underside without making the whole support body dense. Removal depends on interface spacing and the vertical gap too.';
 if(k==='support_interface_spacing'||k==='support_base_pattern_spacing')why=s.value+' is an advisor trial spacing for '+(k==='support_interface_spacing'?'the support contact surface':'the main support body')+'. Closer lines give more backing and use more material; '+c.material+' removal still needs a test.';
 if(k==='bridge_speed')why=s.value+' is an advisor trial for '+c.material+' lines crossing a gap. Bridge span, anchors, cooling and bridge flow matter; the mesh analysis does not calculate the span.';
 if(k==='brim_type')why=s.value==='No-brim'?'The measured footprint does not trigger the advisor stability rule. Leave a brim on if this filament or plate has already shown lifting.':'The model shape or selected material triggers the advisor stability rule. A removable border adds bed contact but must fit on the plate.';
 if(k==='top_shell_thickness'){why=s.value+' is the advisor top-skin target'+(parseFloat(s.value)>=1.2?' because the orientation or your flat-part choice indicates a broad top':' for your selected use')+'. More solid layers can keep the internal pattern from showing through the top.';tradeoff='A thicker top needs more plastic and time. Very thin objects can become fully solid, and a hollow opening is not automatically covered unless the sliced geometry requires it.';check='Inspect the solid layers under the visible top in Preview. Test a top patch before increasing thickness further.';}
 if(k==='bottom_shell_thickness'){why=s.value+' is the advisor bottom-skin target for your selected use. It sets solid layer thickness where the model has a bottom surface; it does not add a missing base to your design.';tradeoff='More bottom layers add material and time. Their appearance still depends on the plate texture and first-layer setup.';}
 if(k==='sparse_infill_pattern'){tradeoff='Pattern choice changes internal paths and time. A thin hollow wall may have little room for any infill, and the pattern does not overcome weak bonding between layers.';check='Preview internal fill and the backing under top skins. Test any load-bearing design rather than judging strength from the pattern name.';}
 if(k.includes('line_width')){tradeoff='Wider lines can improve coverage but need more plastic flow and may blur narrow details. Thinner lines can leave gaps or reduce side-wall material.';check='Inspect actual line widths and wall spacing in Preview. Compare a small detail or fit sample with the matching nozzle preset.';}
 if(k.includes('scarf')||k.startsWith('seam_slope_')){tradeoff='A gradual seam can hide a join but may leave a bulge or weak join if its flow and geometry are unsuitable.';check='Print a small curved wall with your exact filament. Check whether the Process override is enabled before editing Filament scarf values.';}
 if((k.startsWith('ironing_')&&k!=='ironing_type')||k.startsWith('support_ironing_')||k==='enable_support_ironing'){tradeoff='This extra smoothing pass adds time. Too much plastic or unsuitable spacing can leave ridges instead of a smooth surface.';check='Keep a proven ironing setup or test a small flat patch. Support ironing also requires its compatible interface settings.';}
 if(k.startsWith('prime_tower_')||k==='enable_prime_tower'||k==='enable_tower_interface_features'||k==='wipe_tower_no_sparse_layers'||/^filament_(?:prime_volume|change_length|ramming_|pre_cooling_|tower_|cooling_before_tower)/.test(k)){tradeoff='Tool-change preparation can add time and waste. Reducing it without testing can leave mixed colors, weak extrusion or nozzle residue.';check='Use the matching tool/extruder and material-change preset. Review tower placement, purge behavior and actual tool changes in Studio.';}
 if(k.startsWith('flush_into_')){tradeoff='This can reduce discarded material, but mixed colors may show through the part or change support material behavior.';check='Confirm the assigned materials and compatible prime tower. Inspect where flushed material goes before using a customer-visible part.';}
 if(k.startsWith('fuzzy_')){tradeoff='Texture changes the outside dimensions and appearance; it can make a mating surface or bottle cover harder to fit.';check='Keep texture off mating surfaces. Test a small textured patch and measure the maximum outside dimensions.';}
 if(k.startsWith('conformal_')||k.includes('skeleton')||k.startsWith('skin_infill')||k==='infill_lock_depth'){tradeoff='These specialized infill layouts can change texture, support under skins and print paths. A pleasing pattern is not a verified strength result.';check='Use a Studio version and pattern that exposes these fields. Inspect several layers and test a representative sample before using specialized infill.';}
 if(k.startsWith('interlocking_')||k==='mmu_segmented_region_interlocking_depth'){tradeoff='Internal interlocking changes how material regions join and consumes space near their boundary. Results depend on the actual material pair.';check='Inspect the sliced material boundary and print a joint sample using the two assigned filaments.';}
 if(k==='filament_cost'||k==='filament_density'||k==='default_filament_colour'){tradeoff='This field changes recorded information or estimates, not extrusion quality or mechanical strength.';check=k==='filament_cost'?'Enter your actual price per kilogram in Studio’s configured currency. Compare the estimate with your purchase cost.':k==='filament_density'?'Use the density in the exact product data sheet when available; changing it affects weight estimates.':'Use the actual spool color for identification. Physical color effects need their own print test.';}
 if(['filament_type','filament_vendor','filament_soluble','filament_is_support','impact_strength_z','filament_adhesiveness_category','filament_printable'].includes(k)){tradeoff='Editing a material label or property does not change the physical filament or prove it is suitable for this print.';check='Choose the preset for the actual spool and verify its manufacturer specifications and compatible feed path.';}
 if(k==='required_nozzle_HRC'){tradeoff='An insufficiently wear-resistant nozzle can deteriorate with abrasive filament; changing the recorded requirement does not improve nozzle hardness.';check='Match the installed nozzle material to the exact filament specification before printing.';}
 if(k==='filename_format'||k==='gcode_add_line_number'||k==='exclude_object'){tradeoff='These output controls affect exported files or printer-command compatibility rather than surface finish.';check='Use the selected printer’s supported output format. Inspect the exported file name or commands in a compatible workflow.';}
 if(k==='print_sequence'){tradeoff='Finishing objects one at a time can reduce some travel but can put tall printed objects in the moving toolhead’s way.';check='Use Studio’s collision-clearance checks with the real toolhead and object placement.';}
 if(k.startsWith('spiral_mode')){tradeoff='A continuous single wall can be fast and hide seams, but changes the part structure and is unsuitable for many modeled covers, bows or complex details.';check='Only use a suitable vase-mode model. Inspect the entire sliced wall and opening; do not enable it just because a part is hollow.';}
 if(k==='brim_object_gap'){tradeoff='A larger gap makes the brim easier to remove but can reduce how well it holds the part down.';check='Test adhesion and removal on the installed plate using the actual filament.';}
 if(k==='support_on_build_plate_only'){tradeoff='This can avoid marks on upper model surfaces, but can leave areas unreachable from the plate without support.';check='Inspect every underside and support root. Do not enable it solely to reduce support material.';}
 if(k==='additional_cooling_fan_speed'||k==='first_x_layer_fan_speed'||k==='close_additional_fan_first_x_layers'||k==='additional_fan_full_speed_layer'){tradeoff='The auxiliary side fan is separate from the nozzle part fan. Strong side cooling can lift a wide part or cool one side more than the other.';check='Confirm your printer has this fan. Test bed adhesion and surface consistency before increasing its speed.';}
 if(k==='activate_air_filtration'||k.includes('exhaust_fan')){tradeoff='Exhaust and filtration affect enclosure conditions. Fan speed alone does not prove emissions are controlled, and excess airflow can disrupt heat-sensitive prints.';check='Follow the selected printer and material ventilation guidance; keep these separate from part-cooling fan settings.';}
 const numericRule=s.intent!=='retain'&&['Model','Preference'].includes(s.basis);
 const evidence=s.intent==='retain'?'Keep existing: a replacement has not been justified by this model.':numericRule?'Advisor rule: the source explains the setting; it does not certify this exact value for your print.':s.confidence==='high'?'Published profile or product value: confidence is in the recorded source, not a guarantee of print success.':'Baseline or incomplete product evidence: confirm your exact filament and printer preset.';
 const line=(definitionLines as Record<string,number>)[k];
 const explanation:SettingExplanation={meaning,tradeoff,check,evidence,definitionSource:{title:'Bambu Studio · definition of '+s.name,url:'https://github.com/bambulab/BambuStudio/blob/'+studioVersion+'/src/libslic3r/PrintConfig.cpp'+(line?'#L'+line:''),version:studioVersion,accessed:'2026-10-13'}};
 return {...s,reason:why,explanation};
}
