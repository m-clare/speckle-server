export const speckle_basic_vert = /* glsl */`
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
uniform mat4 rtcMatrix;

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	//#include <project_vertex> // EDITED CHUNK
	vec4 mvPosition = vec4( transformed, 1.0 );

	#ifdef USE_INSTANCING

		mvPosition = instanceMatrix * mvPosition;

	#endif
	// mvPosition = modelViewMatrix * mvPosition;
	mvPosition = rtcMatrix * mvPosition;
	mvPosition = viewMatrix * mvPosition;

	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>

}
`;