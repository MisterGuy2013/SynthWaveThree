( function () {

	function computeTangents( geometry ) {

		geometry.computeTangents();
		console.warn( 'THREE.BufferGeometryUtils: .computeTangents() has been removed. Use THREE.BufferGeometry.computeTangents() instead.' );

	}
	/**
	 * @param  {Array<BufferGeometry>} geometries
	 * @param  {Boolean} useGroups
	 * @return {BufferGeometry}
	 */


	function mergeBufferGeometries( geometries, useGroups = false ) {

		const isIndexed = geometries[ 0 ].index !== null;
		const attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
		const morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );
		const attributes = {};
		const morphAttributes = {};
		const morphTargetsRelative = geometries[ 0 ].morphTargetsRelative;
		const mergedGeometry = new THREE.BufferGeometry();
		let offset = 0;

		for ( let i = 0; i < geometries.length; ++ i ) {

			const geometry = geometries[ i ];
			let attributesCount = 0; // ensure that all geometries are indexed, or none

			if ( isIndexed !== ( geometry.index !== null ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.' );
				return null;

			} // gather attributes, exit early if they're different


			for ( const name in geometry.attributes ) {

				if ( ! attributesUsed.has( name ) ) {

					console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure "' + name + '" attribute exists among all geometries, or in none of them.' );
					return null;

				}

				if ( attributes[ name ] === undefined ) attributes[ name ] = [];
				attributes[ name ].push( geometry.attributes[ name ] );
				attributesCount ++;

			} // ensure geometries have the same number of attributes


			if ( attributesCount !== attributesUsed.size ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. Make sure all geometries have the same number of attributes.' );
				return null;

			} // gather morph attributes, exit early if they're different


			if ( morphTargetsRelative !== geometry.morphTargetsRelative ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. .morphTargetsRelative must be consistent throughout all geometries.' );
				return null;

			}

			for ( const name in geometry.morphAttributes ) {

				if ( ! morphAttributesUsed.has( name ) ) {

					console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '.  .morphAttributes must be consistent throughout all geometries.' );
					return null;

				}

				if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];
				morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

			} // gather .userData


			mergedGeometry.userData.mergedUserData = mergedGeometry.userData.mergedUserData || [];
			mergedGeometry.userData.mergedUserData.push( geometry.userData );

			if ( useGroups ) {

				let count;

				if ( isIndexed ) {

					count = geometry.index.count;

				} else if ( geometry.attributes.position !== undefined ) {

					count = geometry.attributes.position.count;

				} else {

					console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. The geometry must have either an index or a position attribute' );
					return null;

				}

				mergedGeometry.addGroup( offset, count, i );
				offset += count;

			}

		} // merge indices


		if ( isIndexed ) {

			let indexOffset = 0;
			const mergedIndex = [];

			for ( let i = 0; i < geometries.length; ++ i ) {

				const index = geometries[ i ].index;

				for ( let j = 0; j < index.count; ++ j ) {

					mergedIndex.push( index.getX( j ) + indexOffset );

				}

				indexOffset += geometries[ i ].attributes.position.count;

			}

			mergedGeometry.setIndex( mergedIndex );

		} // merge attributes


		for ( const name in attributes ) {

			const mergedAttribute = mergeBufferAttributes( attributes[ name ] );

			if ( ! mergedAttribute ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' attribute.' );
				return null;

			}

			mergedGeometry.setAttribute( name, mergedAttribute );

		} // merge morph attributes


		for ( const name in morphAttributes ) {

			const numMorphTargets = morphAttributes[ name ][ 0 ].length;
			if ( numMorphTargets === 0 ) break;
			mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
			mergedGeometry.morphAttributes[ name ] = [];

			for ( let i = 0; i < numMorphTargets; ++ i ) {

				const morphAttributesToMerge = [];

				for ( let j = 0; j < morphAttributes[ name ].length; ++ j ) {

					morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

				}

				const mergedMorphAttribute = mergeBufferAttributes( morphAttributesToMerge );

				if ( ! mergedMorphAttribute ) {

					console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' morphAttribute.' );
					return null;

				}

				mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

			}

		}

		return mergedGeometry;

	}
	/**
 * @param {Array<BufferAttribute>} attributes
 * @return {BufferAttribute}
 */


	function mergeBufferAttributes( attributes ) {

		let TypedArray;
		let itemSize;
		let normalized;
		let arrayLength = 0;

		for ( let i = 0; i < attributes.length; ++ i ) {

			const attribute = attributes[ i ];

			if ( attribute.isInterleavedBufferAttribute ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. InterleavedBufferAttributes are not supported.' );
				return null;

			}

			if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;

			if ( TypedArray !== attribute.array.constructor ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. THREE.BufferAttribute.array must be of consistent array types across matching attributes.' );
				return null;

			}

			if ( itemSize === undefined ) itemSize = attribute.itemSize;

			if ( itemSize !== attribute.itemSize ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. THREE.BufferAttribute.itemSize must be consistent across matching attributes.' );
				return null;

			}

			if ( normalized === undefined ) normalized = attribute.normalized;

			if ( normalized !== attribute.normalized ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. THREE.BufferAttribute.normalized must be consistent across matching attributes.' );
				return null;

			}

			arrayLength += attribute.array.length;

		}

		const array = new TypedArray( arrayLength );
		let offset = 0;

		for ( let i = 0; i < attributes.length; ++ i ) {

			array.set( attributes[ i ].array, offset );
			offset += attributes[ i ].array.length;

		}

		return new THREE.BufferAttribute( array, itemSize, normalized );

	}
	/**
 * @param {Array<BufferAttribute>} attributes
 * @return {Array<InterleavedBufferAttribute>}
 */


	function interleaveAttributes( attributes ) {

		// Interleaves the provided attributes into an THREE.InterleavedBuffer and returns
		// a set of InterleavedBufferAttributes for each attribute
		let TypedArray;
		let arrayLength = 0;
		let stride = 0; // calculate the the length and type of the interleavedBuffer

		for ( let i = 0, l = attributes.length; i < l; ++ i ) {

			const attribute = attributes[ i ];
			if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;

			if ( TypedArray !== attribute.array.constructor ) {

				console.error( 'AttributeBuffers of different types cannot be interleaved' );
				return null;

			}

			arrayLength += attribute.array.length;
			stride += attribute.itemSize;

		} // Create the set of buffer attributes


		const interleavedBuffer = new THREE.InterleavedBuffer( new TypedArray( arrayLength ), stride );
		let offset = 0;
		const res = [];
		const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
		const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

		for ( let j = 0, l = attributes.length; j < l; j ++ ) {

			const attribute = attributes[ j ];
			const itemSize = attribute.itemSize;
			const count = attribute.count;
			const iba = new THREE.InterleavedBufferAttribute( interleavedBuffer, itemSize, offset, attribute.normalized );
			res.push( iba );
			offset += itemSize; // Move the data for each attribute into the new interleavedBuffer
			// at the appropriate offset

			for ( let c = 0; c < count; c ++ ) {

				for ( let k = 0; k < itemSize; k ++ ) {

					iba[ setters[ k ] ]( c, attribute[ getters[ k ] ]( c ) );

				}

			}

		}

		return res;

	}
	/**
 * @param {Array<BufferGeometry>} geometry
 * @return {number}
 */


	function estimateBytesUsed( geometry ) {

		// Return the estimated memory used by this geometry in bytes
		// Calculate using itemSize, count, and BYTES_PER_ELEMENT to account
		// for InterleavedBufferAttributes.
		let mem = 0;

		for ( const name in geometry.attributes ) {

			const attr = geometry.getAttribute( name );
			mem += attr.count * attr.itemSize * attr.array.BYTES_PER_ELEMENT;

		}

		const indices = geometry.getIndex();
		mem += indices ? indices.count * indices.itemSize * indices.array.BYTES_PER_ELEMENT : 0;
		return mem;

	}
	/**
 * @param {BufferGeometry} geometry
 * @param {number} tolerance
 * @return {BufferGeometry>}
 */


	function mergeVertices( geometry, tolerance = 1e-4 ) {

		tolerance = Math.max( tolerance, Number.EPSILON ); // Generate an index buffer if the geometry doesn't have one, or optimize it
		// if it's already available.

		const hashToIndex = {};
		const indices = geometry.getIndex();
		const positions = geometry.getAttribute( 'position' );
		const vertexCount = indices ? indices.count : positions.count; // next value for triangle indices

		let nextIndex = 0; // attributes and new attribute arrays

		const attributeNames = Object.keys( geometry.attributes );
		const attrArrays = {};
		const morphAttrsArrays = {};
		const newIndices = [];
		const getters = [ 'getX', 'getY', 'getZ', 'getW' ]; // initialize the arrays

		for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

			const name = attributeNames[ i ];
			attrArrays[ name ] = [];
			const morphAttr = geometry.morphAttributes[ name ];

			if ( morphAttr ) {

				morphAttrsArrays[ name ] = new Array( morphAttr.length ).fill().map( () => [] );

			}

		} // convert the error tolerance to an amount of decimal places to truncate to


		const decimalShift = Math.log10( 1 / tolerance );
		const shiftMultiplier = Math.pow( 10, decimalShift );

		for ( let i = 0; i < vertexCount; i ++ ) {

			const index = indices ? indices.getX( i ) : i; // Generate a hash for the vertex attributes at the current index 'i'

			let hash = '';

			for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

				const name = attributeNames[ j ];
				const attribute = geometry.getAttribute( name );
				const itemSize = attribute.itemSize;

				for ( let k = 0; k < itemSize; k ++ ) {

					// double tilde truncates the decimal value
					hash += `${~ ~ ( attribute[ getters[ k ] ]( index ) * shiftMultiplier )},`;

				}

			} // Add another reference to the vertex if it's already
			// used by another index


			if ( hash in hashToIndex ) {

				newIndices.push( hashToIndex[ hash ] );

			} else {

				// copy data to the new index in the attribute arrays
				for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

					const name = attributeNames[ j ];
					const attribute = geometry.getAttribute( name );
					const morphAttr = geometry.morphAttributes[ name ];
					const itemSize = attribute.itemSize;
					const newarray = attrArrays[ name ];
					const newMorphArrays = morphAttrsArrays[ name ];

					for ( let k = 0; k < itemSize; k ++ ) {

						const getterFunc = getters[ k ];
						newarray.push( attribute[ getterFunc ]( index ) );

						if ( morphAttr ) {

							for ( let m = 0, ml = morphAttr.length; m < ml; m ++ ) {

								newMorphArrays[ m ].push( morphAttr[ m ][ getterFunc ]( index ) );

							}

						}

					}

				}

				hashToIndex[ hash ] = nextIndex;
				newIndices.push( nextIndex );
				nextIndex ++;

			}

		} // Generate typed arrays from new attribute arrays and update
		// the attributeBuffers


		const result = geometry.clone();

		for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

			const name = attributeNames[ i ];
			const oldAttribute = geometry.getAttribute( name );
			const buffer = new oldAttribute.array.constructor( attrArrays[ name ] );
			const attribute = new THREE.BufferAttribute( buffer, oldAttribute.itemSize, oldAttribute.normalized );
			result.setAttribute( name, attribute ); // Update the attribute arrays

			if ( name in morphAttrsArrays ) {

				for ( let j = 0; j < morphAttrsArrays[ name ].length; j ++ ) {

					const oldMorphAttribute = geometry.morphAttributes[ name ][ j ];
					const buffer = new oldMorphAttribute.array.constructor( morphAttrsArrays[ name ][ j ] );
					const morphAttribute = new THREE.BufferAttribute( buffer, oldMorphAttribute.itemSize, oldMorphAttribute.normalized );
					result.morphAttributes[ name ][ j ] = morphAttribute;

				}

			}

		} // indices


		result.setIndex( newIndices );
		return result;

	}
	/**
 * @param {BufferGeometry} geometry
 * @param {number} drawMode
 * @return {BufferGeometry>}
 */


	function toTrianglesDrawMode( geometry, drawMode ) {

		if ( drawMode === THREE.TrianglesDrawMode ) {

			console.warn( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.' );
			return geometry;

		}

		if ( drawMode === THREE.TriangleFanDrawMode || drawMode === THREE.TriangleStripDrawMode ) {

			let index = geometry.getIndex(); // generate index if not present

			if ( index === null ) {

				const indices = [];
				const position = geometry.getAttribute( 'position' );

				if ( position !== undefined ) {

					for ( let i = 0; i < position.count; i ++ ) {

						indices.push( i );

					}

					geometry.setIndex( indices );
					index = geometry.getIndex();

				} else {

					console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.' );
					return geometry;

				}

			} //


			const numberOfTriangles = index.count - 2;
			const newIndices = [];

			if ( drawMode === THREE.TriangleFanDrawMode ) {

				// gl.TRIANGLE_FAN
				for ( let i = 1; i <= numberOfTriangles; i ++ ) {

					newIndices.push( index.getX( 0 ) );
					newIndices.push( index.getX( i ) );
					newIndices.push( index.getX( i + 1 ) );

				}

			} else {

				// gl.TRIANGLE_STRIP
				for ( let i = 0; i < numberOfTriangles; i ++ ) {

					if ( i % 2 === 0 ) {

						newIndices.push( index.getX( i ) );
						newIndices.push( index.getX( i + 1 ) );
						newIndices.push( index.getX( i + 2 ) );

					} else {

						newIndices.push( index.getX( i + 2 ) );
						newIndices.push( index.getX( i + 1 ) );
						newIndices.push( index.getX( i ) );

					}

				}

			}

			if ( newIndices.length / 3 !== numberOfTriangles ) {

				console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.' );

			} // build final geometry


			const newGeometry = geometry.clone();
			newGeometry.setIndex( newIndices );
			newGeometry.clearGroups();
			return newGeometry;

		} else {

			console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', drawMode );
			return geometry;

		}

	}
	/**
 * Calculates the morphed attributes of a morphed/skinned THREE.BufferGeometry.
 * Helpful for Raytracing or Decals.
 * @param {Mesh | Line | Points} object An instance of Mesh, Line or Points.
 * @return {Object} An Object with original position/normal attributes and morphed ones.
 */


	function computeMorphedAttributes( object ) {

		if ( object.geometry.isBufferGeometry !== true ) {

			console.error( 'THREE.BufferGeometryUtils: Geometry is not of type THREE.BufferGeometry.' );
			return null;

		}

		const _vA = new THREE.Vector3();

		const _vB = new THREE.Vector3();

		const _vC = new THREE.Vector3();

		const _tempA = new THREE.Vector3();

		const _tempB = new THREE.Vector3();

		const _tempC = new THREE.Vector3();

		const _morphA = new THREE.Vector3();

		const _morphB = new THREE.Vector3();

		const _morphC = new THREE.Vector3();

		function _calculateMorphedAttributeData( object, material, attribute, morphAttribute, morphTargetsRelative, a, b, c, modifiedAttributeArray ) {

			_vA.fromBufferAttribute( attribute, a );

			_vB.fromBufferAttribute( attribute, b );

			_vC.fromBufferAttribute( attribute, c );

			const morphInfluences = object.morphTargetInfluences;

			if ( material.morphTargets && morphAttribute && morphInfluences ) {

				_morphA.set( 0, 0, 0 );

				_morphB.set( 0, 0, 0 );

				_morphC.set( 0, 0, 0 );

				for ( let i = 0, il = morphAttribute.length; i < il; i ++ ) {

					const influence = morphInfluences[ i ];
					const morph = morphAttribute[ i ];
					if ( influence === 0 ) continue;

					_tempA.fromBufferAttribute( morph, a );

					_tempB.fromBufferAttribute( morph, b );

					_tempC.fromBufferAttribute( morph, c );

					if ( morphTargetsRelative ) {

						_morphA.addScaledVector( _tempA, influence );

						_morphB.addScaledVector( _tempB, influence );

						_morphC.addScaledVector( _tempC, influence );

					} else {

						_morphA.addScaledVector( _tempA.sub( _vA ), influence );

						_morphB.addScaledVector( _tempB.sub( _vB ), influence );

						_morphC.addScaledVector( _tempC.sub( _vC ), influence );

					}

				}

				_vA.add( _morphA );

				_vB.add( _morphB );

				_vC.add( _morphC );

			}

			if ( object.isSkinnedMesh ) {

				object.boneTransform( a, _vA );
				object.boneTransform( b, _vB );
				object.boneTransform( c, _vC );

			}

			modifiedAttributeArray[ a * 3 + 0 ] = _vA.x;
			modifiedAttributeArray[ a * 3 + 1 ] = _vA.y;
			modifiedAttributeArray[ a * 3 + 2 ] = _vA.z;
			modifiedAttributeArray[ b * 3 + 0 ] = _vB.x;
			modifiedAttributeArray[ b * 3 + 1 ] = _vB.y;
			modifiedAttributeArray[ b * 3 + 2 ] = _vB.z;
			modifiedAttributeArray[ c * 3 + 0 ] = _vC.x;
			modifiedAttributeArray[ c * 3 + 1 ] = _vC.y;
			modifiedAttributeArray[ c * 3 + 2 ] = _vC.z;

		}

		const geometry = object.geometry;
		const material = object.material;
		let a, b, c;
		const index = geometry.index;
		const positionAttribute = geometry.attributes.position;
		const morphPosition = geometry.morphAttributes.position;
		const morphTargetsRelative = geometry.morphTargetsRelative;
		const normalAttribute = geometry.attributes.normal;
		const morphNormal = geometry.morphAttributes.position;
		const groups = geometry.groups;
		const drawRange = geometry.drawRange;
		let i, j, il, jl;
		let group, groupMaterial;
		let start, end;
		const modifiedPosition = new Float32Array( positionAttribute.count * positionAttribute.itemSize );
		const modifiedNormal = new Float32Array( normalAttribute.count * normalAttribute.itemSize );

		if ( index !== null ) {

			// indexed buffer geometry
			if ( Array.isArray( material ) ) {

				for ( i = 0, il = groups.length; i < il; i ++ ) {

					group = groups[ i ];
					groupMaterial = material[ group.materialIndex ];
					start = Math.max( group.start, drawRange.start );
					end = Math.min( group.start + group.count, drawRange.start + drawRange.count );

					for ( j = start, jl = end; j < jl; j += 3 ) {

						a = index.getX( j );
						b = index.getX( j + 1 );
						c = index.getX( j + 2 );

						_calculateMorphedAttributeData( object, groupMaterial, positionAttribute, morphPosition, morphTargetsRelative, a, b, c, modifiedPosition );

						_calculateMorphedAttributeData( object, groupMaterial, normalAttribute, morphNormal, morphTargetsRelative, a, b, c, modifiedNormal );

					}

				}

			} else {

				start = Math.max( 0, drawRange.start );
				end = Math.min( index.count, drawRange.start + drawRange.count );

				for ( i = start, il = end; i < il; i += 3 ) {

					a = index.getX( i );
					b = index.getX( i + 1 );
					c = index.getX( i + 2 );

					_calculateMorphedAttributeData( object, material, positionAttribute, morphPosition, morphTargetsRelative, a, b, c, modifiedPosition );

					_calculateMorphedAttributeData( object, material, normalAttribute, morphNormal, morphTargetsRelative, a, b, c, modifiedNormal );

				}

			}

		} else if ( positionAttribute !== undefined ) {

			// non-indexed buffer geometry
			if ( Array.isArray( material ) ) {

				for ( i = 0, il = groups.length; i < il; i ++ ) {

					group = groups[ i ];
					groupMaterial = material[ group.materialIndex ];
					start = Math.max( group.start, drawRange.start );
					end = Math.min( group.start + group.count, drawRange.start + drawRange.count );

					for ( j = start, jl = end; j < jl; j += 3 ) {

						a = j;
						b = j + 1;
						c = j + 2;

						_calculateMorphedAttributeData( object, groupMaterial, positionAttribute, morphPosition, morphTargetsRelative, a, b, c, modifiedPosition );

						_calculateMorphedAttributeData( object, groupMaterial, normalAttribute, morphNormal, morphTargetsRelative, a, b, c, modifiedNormal );

					}

				}

			} else {

				start = Math.max( 0, drawRange.start );
				end = Math.min( positionAttribute.count, drawRange.start + drawRange.count );

				for ( i = start, il = end; i < il; i += 3 ) {

					a = i;
					b = i + 1;
					c = i + 2;

					_calculateMorphedAttributeData( object, material, positionAttribute, morphPosition, morphTargetsRelative, a, b, c, modifiedPosition );

					_calculateMorphedAttributeData( object, material, normalAttribute, morphNormal, morphTargetsRelative, a, b, c, modifiedNormal );

				}

			}

		}

		const morphedPositionAttribute = new THREE.Float32BufferAttribute( modifiedPosition, 3 );
		const morphedNormalAttribute = new THREE.Float32BufferAttribute( modifiedNormal, 3 );
		return {
			positionAttribute: positionAttribute,
			normalAttribute: normalAttribute,
			morphedPositionAttribute: morphedPositionAttribute,
			morphedNormalAttribute: morphedNormalAttribute
		};

	}

	THREE.BufferGeometryUtils = {};
	THREE.BufferGeometryUtils.computeMorphedAttributes = computeMorphedAttributes;
	THREE.BufferGeometryUtils.computeTangents = computeTangents;
	THREE.BufferGeometryUtils.estimateBytesUsed = estimateBytesUsed;
	THREE.BufferGeometryUtils.interleaveAttributes = interleaveAttributes;
	THREE.BufferGeometryUtils.mergeBufferAttributes = mergeBufferAttributes;
	THREE.BufferGeometryUtils.mergeBufferGeometries = mergeBufferGeometries;
	THREE.BufferGeometryUtils.mergeVertices = mergeVertices;
	THREE.BufferGeometryUtils.toTrianglesDrawMode = toTrianglesDrawMode;

} )();































































































































( function () {

	/**
 * parameters = {
 *  color: <hex>,
 *  linewidth: <float>,
 *  dashed: <boolean>,
 *  dashScale: <float>,
 *  dashSize: <float>,
 *  gapSize: <float>,
 *  resolution: <Vector2>, // to be set by renderer
 * }
 */
	THREE.UniformsLib.line = {
		worldUnits: {
			value: 1
		},
		linewidth: {
			value: 1
		},
		resolution: {
			value: new THREE.Vector2( 1, 1 )
		},
		dashScale: {
			value: 1
		},
		dashSize: {
			value: 1
		},
		gapSize: {
			value: 1
		} // todo FIX - maybe change to totalSize

	};
	THREE.ShaderLib[ 'line' ] = {
		uniforms: THREE.UniformsUtils.merge( [ THREE.UniformsLib.common, THREE.UniformsLib.fog, THREE.UniformsLib.line ] ),
		vertexShader:
  /* glsl */
  `
		#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform float linewidth;
uniform vec2 resolution;
uniform vec3 camPosition;

attribute vec3 instanceStart;
attribute vec3 instanceEnd;

attribute vec3 instanceColorStart;
attribute vec3 instanceColorEnd;

varying vec2 vUv;
varying vec4 worldPos;
varying vec3 worldStart;
varying vec3 worldEnd;
varying float linewidthM;

#ifdef USE_DASH

    uniform float dashScale;
    attribute float instanceDistanceStart;
    attribute float instanceDistanceEnd;
    varying float vLineDistance;

#endif

void trimSegment( const in vec4 start, inout vec4 end ) {
    // trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );
}

float calculateSizeAnnotationFactor(vec3 worldPos) {
    float distance = length(camPosition - worldPos);
    return 1.0 / distance;
}



void main() {

float linewidthC =  linewidth;// * calculateSizeAnnotationFactor(position);

linewidthM = linewidthC;
    // existing code

    

    // existing code


			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			vUv = uv;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			worldStart = start.xyz;
			worldEnd = end.xyz;

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				// get the offset direction as perpendicular to the view vector
				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 offset;
				if ( position.y < 0.5 ) {

					offset = normalize( cross( start.xyz, worldDir ) );

				} else {

					offset = normalize( cross( end.xyz, worldDir ) );

				}
   

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// extend the line bounds to encompass  endcaps
					start.xyz += - worldDir * linewidthC * 0.5;
					end.xyz += worldDir * linewidthC * 0.5;

					// shift the position of the quad so it hugs the forward edge of the line
					offset.xy -= dir * forwardOffset;
					offset.z += 0.5;

				#endif

				// endcaps
				if ( position.y > 1.0 || position.y < 0.0 ) {

					offset.xy += dir * 2.0 * forwardOffset;

				}

				

				// set the world position
				worldPos = ( position.y < 0.5 ) ? start : end;
				worldPos.xyz += offset;

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segements overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				float sizeAnnotationStart = calculateSizeAnnotationFactor(worldStart);
    float sizeAnnotationEnd = calculateSizeAnnotationFactor(worldEnd);

    // Modify linewidth based on sizeAnnotation
    float sizeAnnotatedLinewidth = linewidth * mix(sizeAnnotationStart, sizeAnnotationEnd, position.y);
    offset *= sizeAnnotatedLinewidth * 5.;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,
		fragmentShader:
  /* glsl */
  `
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;
    uniform vec3 camPosition;

		#ifdef USE_DASH

			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;
		varying vec4 worldPos;
		varying vec3 worldStart;
		varying vec3 worldEnd;
    //varying float linewidthM;

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		varying vec2 vUv;
    
		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			float alpha = opacity;

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <encodings_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`
	};

	class LineMaterial extends THREE.ShaderMaterial {

		constructor( parameters ) {

			super( {
				type: 'LineMaterial',
				uniforms: THREE.UniformsUtils.clone( THREE.ShaderLib[ 'line' ].uniforms ),
				vertexShader: THREE.ShaderLib[ 'line' ].vertexShader,
				fragmentShader: THREE.ShaderLib[ 'line' ].fragmentShader,
				clipping: true // required for clipping support

			} );
			Object.defineProperties( this, {
				color: {
					enumerable: true,
					get: function () {

						return this.uniforms.diffuse.value;

					},
					set: function ( value ) {

						this.uniforms.diffuse.value = value;

					}
				},
				worldUnits: {
					enumerable: true,
					get: function () {

						return 'WORLD_UNITS' in this.defines;

					},
					set: function ( value ) {

						if ( value === true ) {

							this.defines.WORLD_UNITS = '';

						} else {

							delete this.defines.WORLD_UNITS;

						}

					}
				},
				linewidth: {
					enumerable: true,
					get: function () {

						return this.uniforms.linewidth.value;

					},
					set: function ( value ) {

						this.uniforms.linewidth.value = value;

					}
				},
				dashed: {
					enumerable: true,
					get: function () {

						return Boolean( 'USE_DASH' in this.defines );

					},

					set( value ) {

						if ( Boolean( value ) !== Boolean( 'USE_DASH' in this.defines ) ) {

							this.needsUpdate = true;

						}

						if ( value === true ) {

							this.defines.USE_DASH = '';

						} else {

							delete this.defines.USE_DASH;

						}

					}

				},
				dashScale: {
					enumerable: true,
					get: function () {

						return this.uniforms.dashScale.value;

					},
					set: function ( value ) {

						this.uniforms.dashScale.value = value;

					}
				},
				dashSize: {
					enumerable: true,
					get: function () {

						return this.uniforms.dashSize.value;

					},
					set: function ( value ) {

						this.uniforms.dashSize.value = value;

					}
				},
				dashOffset: {
					enumerable: true,
					get: function () {

						return this.uniforms.dashOffset.value;

					},
					set: function ( value ) {

						this.uniforms.dashOffset.value = value;

					}
				},
				gapSize: {
					enumerable: true,
					get: function () {

						return this.uniforms.gapSize.value;

					},
					set: function ( value ) {

						this.uniforms.gapSize.value = value;

					}
				},
				opacity: {
					enumerable: true,
					get: function () {

						return this.uniforms.opacity.value;

					},
					set: function ( value ) {

						this.uniforms.opacity.value = value;

					}
				},
				resolution: {
					enumerable: true,
					get: function () {

						return this.uniforms.resolution.value;

					},
					set: function ( value ) {

						this.uniforms.resolution.value.copy( value );

					}
				},
				alphaToCoverage: {
					enumerable: true,
					get: function () {

						return Boolean( 'ALPHA_TO_COVERAGE' in this.defines );

					},
					set: function ( value ) {

						if ( Boolean( value ) !== Boolean( 'ALPHA_TO_COVERAGE' in this.defines ) ) {

							this.needsUpdate = true;

						}

						if ( value === true ) {

							this.defines.ALPHA_TO_COVERAGE = '';
							this.extensions.derivatives = true;

						} else {

							delete this.defines.ALPHA_TO_COVERAGE;
							this.extensions.derivatives = false;

						}

					}
				}
			} );
			this.setValues( parameters );

		}

	}

	LineMaterial.prototype.isLineMaterial = true;

	THREE.LineMaterial = LineMaterial;

} )();




( function () {

	const _box = new THREE.Box3();

	const _vector = new THREE.Vector3();

	class LineSegmentsGeometry extends THREE.InstancedBufferGeometry {

		constructor() {

			super();
			this.type = 'LineSegmentsGeometry';
			const positions = [ - 1, 2, 0, 1, 2, 0, - 1, 1, 0, 1, 1, 0, - 1, 0, 0, 1, 0, 0, - 1, - 1, 0, 1, - 1, 0 ];
			const uvs = [ - 1, 2, 1, 2, - 1, 1, 1, 1, - 1, - 1, 1, - 1, - 1, - 2, 1, - 2 ];
			const index = [ 0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5 ];
			this.setIndex( index );
			this.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
			this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

		}

		applyMatrix4( matrix ) {

			const start = this.attributes.instanceStart;
			const end = this.attributes.instanceEnd;

			if ( start !== undefined ) {

				start.applyMatrix4( matrix );
				end.applyMatrix4( matrix );
				start.needsUpdate = true;

			}

			if ( this.boundingBox !== null ) {

				this.computeBoundingBox();

			}

			if ( this.boundingSphere !== null ) {

				this.computeBoundingSphere();

			}

			return this;

		}

		setPositions( array ) {

			let lineSegments;

			if ( array instanceof Float32Array ) {

				lineSegments = array;

			} else if ( Array.isArray( array ) ) {

				lineSegments = new Float32Array( array );

			}

			const instanceBuffer = new THREE.InstancedInterleavedBuffer( lineSegments, 6, 1 ); // xyz, xyz

			this.setAttribute( 'instanceStart', new THREE.InterleavedBufferAttribute( instanceBuffer, 3, 0 ) ); // xyz

			this.setAttribute( 'instanceEnd', new THREE.InterleavedBufferAttribute( instanceBuffer, 3, 3 ) ); // xyz
			//

			this.computeBoundingBox();
			this.computeBoundingSphere();
			return this;

		}

		setColors( array ) {

			let colors;

			if ( array instanceof Float32Array ) {

				colors = array;

			} else if ( Array.isArray( array ) ) {

				colors = new Float32Array( array );

			}

			const instanceColorBuffer = new THREE.InstancedInterleavedBuffer( colors, 6, 1 ); // rgb, rgb

			this.setAttribute( 'instanceColorStart', new THREE.InterleavedBufferAttribute( instanceColorBuffer, 3, 0 ) ); // rgb

			this.setAttribute( 'instanceColorEnd', new THREE.InterleavedBufferAttribute( instanceColorBuffer, 3, 3 ) ); // rgb

			return this;

		}

		fromWireframeGeometry( geometry ) {

			this.setPositions( geometry.attributes.position.array );
			return this;

		}

		fromEdgesGeometry( geometry ) {

			this.setPositions( geometry.attributes.position.array );
			return this;

		}

		fromMesh( mesh ) {

			this.fromWireframeGeometry( new THREE.WireframeGeometry( mesh.geometry ) ); // set colors, maybe

			return this;

		}

		fromLineSegments( lineSegments ) {

			const geometry = lineSegments.geometry;

			if ( geometry.isGeometry ) {

				console.error( 'THREE.LineSegmentsGeometry no longer supports Geometry. Use THREE.BufferGeometry instead.' );
				return;

			} else if ( geometry.isBufferGeometry ) {

				this.setPositions( geometry.attributes.position.array ); // assumes non-indexed

			} // set colors, maybe


			return this;

		}

		computeBoundingBox() {

			if ( this.boundingBox === null ) {

				this.boundingBox = new THREE.Box3();

			}

			const start = this.attributes.instanceStart;
			const end = this.attributes.instanceEnd;

			if ( start !== undefined && end !== undefined ) {

				this.boundingBox.setFromBufferAttribute( start );

				_box.setFromBufferAttribute( end );

				this.boundingBox.union( _box );

			}

		}

		computeBoundingSphere() {

			if ( this.boundingSphere === null ) {

				this.boundingSphere = new THREE.Sphere();

			}

			if ( this.boundingBox === null ) {

				this.computeBoundingBox();

			}

			const start = this.attributes.instanceStart;
			const end = this.attributes.instanceEnd;

			if ( start !== undefined && end !== undefined ) {

				const center = this.boundingSphere.center;
				this.boundingBox.getCenter( center );
				let maxRadiusSq = 0;

				for ( let i = 0, il = start.count; i < il; i ++ ) {

					_vector.fromBufferAttribute( start, i );

					maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector ) );

					_vector.fromBufferAttribute( end, i );

					maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector ) );

				}

				this.boundingSphere.radius = Math.sqrt( maxRadiusSq );

				if ( isNaN( this.boundingSphere.radius ) ) {

					console.error( 'THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.', this );

				}

			}

		}

		toJSON() { // todo
		}

		applyMatrix( matrix ) {

			console.warn( 'THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4().' );
			return this.applyMatrix4( matrix );

		}

	}

	LineSegmentsGeometry.prototype.isLineSegmentsGeometry = true;

	THREE.LineSegmentsGeometry = LineSegmentsGeometry;

} )();



( function () {

	const _start = new THREE.Vector3();

	const _end = new THREE.Vector3();

	const _start4 = new THREE.Vector4();

	const _end4 = new THREE.Vector4();

	const _ssOrigin = new THREE.Vector4();

	const _ssOrigin3 = new THREE.Vector3();

	const _mvMatrix = new THREE.Matrix4();

	const _line = new THREE.Line3();

	const _closestPoint = new THREE.Vector3();

	const _box = new THREE.Box3();

	const _sphere = new THREE.Sphere();

	const _clipToWorldVector = new THREE.Vector4();

	let _ray, _instanceStart, _instanceEnd, _lineWidth; // Returns the margin required to expand by in world space given the distance from the camera,
	// line width, resolution, and camera projection


	function getWorldSpaceHalfWidth( camera, distance, resolution ) {

		// transform into clip space, adjust the x and y values by the pixel width offset, then
		// transform back into world space to get world offset. Note clip space is [-1, 1] so full
		// width does not need to be halved.
		_clipToWorldVector.set( 0, 0, - distance, 1.0 ).applyMatrix4( camera.projectionMatrix );

		_clipToWorldVector.multiplyScalar( 1.0 / _clipToWorldVector.w );

		_clipToWorldVector.x = _lineWidth / resolution.width;
		_clipToWorldVector.y = _lineWidth / resolution.height;

		_clipToWorldVector.applyMatrix4( camera.projectionMatrixInverse );

		_clipToWorldVector.multiplyScalar( 1.0 / _clipToWorldVector.w );

		return Math.abs( Math.max( _clipToWorldVector.x, _clipToWorldVector.y ) );

	}

	function raycastWorldUnits( lineSegments, intersects ) {

		for ( let i = 0, l = _instanceStart.count; i < l; i ++ ) {

			_line.start.fromBufferAttribute( _instanceStart, i );

			_line.end.fromBufferAttribute( _instanceEnd, i );

			const pointOnLine = new THREE.Vector3();
			const point = new THREE.Vector3();

			_ray.distanceSqToSegment( _line.start, _line.end, point, pointOnLine );

			const isInside = point.distanceTo( pointOnLine ) < _lineWidth * 0.5;

			if ( isInside ) {

				intersects.push( {
					point,
					pointOnLine,
					distance: _ray.origin.distanceTo( point ),
					object: lineSegments,
					face: null,
					faceIndex: i,
					uv: null,
					uv2: null
				} );

			}

		}

	}

	function raycastScreenSpace( lineSegments, camera, intersects ) {

		const projectionMatrix = camera.projectionMatrix;
		const material = lineSegments.material;
		const resolution = material.resolution;
		const matrixWorld = lineSegments.matrixWorld;
		const geometry = lineSegments.geometry;
		const instanceStart = geometry.attributes.instanceStart;
		const instanceEnd = geometry.attributes.instanceEnd;
		const near = - camera.near; //
		// pick a point 1 unit out along the ray to avoid the ray origin
		// sitting at the camera origin which will cause "w" to be 0 when
		// applying the projection matrix.

		_ray.at( 1, _ssOrigin ); // ndc space [ - 1.0, 1.0 ]


		_ssOrigin.w = 1;

		_ssOrigin.applyMatrix4( camera.matrixWorldInverse );

		_ssOrigin.applyMatrix4( projectionMatrix );

		_ssOrigin.multiplyScalar( 1 / _ssOrigin.w ); // screen space


		_ssOrigin.x *= resolution.x / 2;
		_ssOrigin.y *= resolution.y / 2;
		_ssOrigin.z = 0;

		_ssOrigin3.copy( _ssOrigin );

		_mvMatrix.multiplyMatrices( camera.matrixWorldInverse, matrixWorld );

		for ( let i = 0, l = instanceStart.count; i < l; i ++ ) {

			_start4.fromBufferAttribute( instanceStart, i );

			_end4.fromBufferAttribute( instanceEnd, i );

			_start4.w = 1;
			_end4.w = 1; // camera space

			_start4.applyMatrix4( _mvMatrix );

			_end4.applyMatrix4( _mvMatrix ); // skip the segment if it's entirely behind the camera


			const isBehindCameraNear = _start4.z > near && _end4.z > near;

			if ( isBehindCameraNear ) {

				continue;

			} // trim the segment if it extends behind camera near


			if ( _start4.z > near ) {

				const deltaDist = _start4.z - _end4.z;
				const t = ( _start4.z - near ) / deltaDist;

				_start4.lerp( _end4, t );

			} else if ( _end4.z > near ) {

				const deltaDist = _end4.z - _start4.z;
				const t = ( _end4.z - near ) / deltaDist;

				_end4.lerp( _start4, t );

			} // clip space


			_start4.applyMatrix4( projectionMatrix );

			_end4.applyMatrix4( projectionMatrix ); // ndc space [ - 1.0, 1.0 ]


			_start4.multiplyScalar( 1 / _start4.w );

			_end4.multiplyScalar( 1 / _end4.w ); // screen space


			_start4.x *= resolution.x / 2;
			_start4.y *= resolution.y / 2;
			_end4.x *= resolution.x / 2;
			_end4.y *= resolution.y / 2; // create 2d segment

			_line.start.copy( _start4 );

			_line.start.z = 0;

			_line.end.copy( _end4 );

			_line.end.z = 0; // get closest point on ray to segment

			const param = _line.closestPointToPointParameter( _ssOrigin3, true );

			_line.at( param, _closestPoint ); // check if the intersection point is within clip space


			const zPos = THREE.MathUtils.lerp( _start4.z, _end4.z, param );
			const isInClipSpace = zPos >= - 1 && zPos <= 1;

			const isInside = _ssOrigin3.distanceTo( _closestPoint ) < _lineWidth * 0.5;

			if ( isInClipSpace && isInside ) {

				_line.start.fromBufferAttribute( instanceStart, i );

				_line.end.fromBufferAttribute( instanceEnd, i );

				_line.start.applyMatrix4( matrixWorld );

				_line.end.applyMatrix4( matrixWorld );

				const pointOnLine = new THREE.Vector3();
				const point = new THREE.Vector3();

				_ray.distanceSqToSegment( _line.start, _line.end, point, pointOnLine );

				intersects.push( {
					point: point,
					pointOnLine: pointOnLine,
					distance: _ray.origin.distanceTo( point ),
					object: lineSegments,
					face: null,
					faceIndex: i,
					uv: null,
					uv2: null
				} );

			}

		}

	}

	class LineSegments2 extends THREE.Mesh {

		constructor( geometry = new THREE.LineSegmentsGeometry(), material = new THREE.LineMaterial( {
			color: Math.random() * 0xffffff
		} ) ) {

			super( geometry, material );
			this.type = 'LineSegments2';

		} // for backwards-compatibility, but could be a method of THREE.LineSegmentsGeometry...


		computeLineDistances() {

			const geometry = this.geometry;
			const instanceStart = geometry.attributes.instanceStart;
			const instanceEnd = geometry.attributes.instanceEnd;
			const lineDistances = new Float32Array( 2 * instanceStart.count );

			for ( let i = 0, j = 0, l = instanceStart.count; i < l; i ++, j += 2 ) {

				_start.fromBufferAttribute( instanceStart, i );

				_end.fromBufferAttribute( instanceEnd, i );

				lineDistances[ j ] = j === 0 ? 0 : lineDistances[ j - 1 ];
				lineDistances[ j + 1 ] = lineDistances[ j ] + _start.distanceTo( _end );

			}

			const instanceDistanceBuffer = new THREE.InstancedInterleavedBuffer( lineDistances, 2, 1 ); // d0, d1

			geometry.setAttribute( 'instanceDistanceStart', new THREE.InterleavedBufferAttribute( instanceDistanceBuffer, 1, 0 ) ); // d0

			geometry.setAttribute( 'instanceDistanceEnd', new THREE.InterleavedBufferAttribute( instanceDistanceBuffer, 1, 1 ) ); // d1

			return this;

		}

		raycast( raycaster, intersects ) {

			const worldUnits = this.material.worldUnits;
			const camera = raycaster.camera;

			if ( camera === null && ! worldUnits ) {

				console.error( 'LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.' );

			}

			const threshold = raycaster.params.Line2 !== undefined ? raycaster.params.Line2.threshold || 0 : 0;
			_ray = raycaster.ray;
			const matrixWorld = this.matrixWorld;
			const geometry = this.geometry;
			const material = this.material;
			_lineWidth = material.linewidth + threshold;
			_instanceStart = geometry.attributes.instanceStart;
			_instanceEnd = geometry.attributes.instanceEnd; // check if we intersect the sphere bounds

			if ( geometry.boundingSphere === null ) {

				geometry.computeBoundingSphere();

			}

			_sphere.copy( geometry.boundingSphere ).applyMatrix4( matrixWorld ); // increase the sphere bounds by the worst case line screen space width


			let sphereMargin;

			if ( worldUnits ) {

				sphereMargin = _lineWidth * 0.5;

			} else {

				const distanceToSphere = Math.max( camera.near, _sphere.distanceToPoint( _ray.origin ) );
				sphereMargin = getWorldSpaceHalfWidth( camera, distanceToSphere, material.resolution );

			}

			_sphere.radius += sphereMargin;

			if ( _ray.intersectsSphere( _sphere ) === false ) {

				return;

			} // check if we intersect the box bounds


			if ( geometry.boundingBox === null ) {

				geometry.computeBoundingBox();

			}

			_box.copy( geometry.boundingBox ).applyMatrix4( matrixWorld ); // increase the box bounds by the worst case line width


			let boxMargin;

			if ( worldUnits ) {

				boxMargin = _lineWidth * 0.5;

			} else {

				const distanceToBox = Math.max( camera.near, _box.distanceToPoint( _ray.origin ) );
				boxMargin = getWorldSpaceHalfWidth( camera, distanceToBox, material.resolution );

			}

			_box.expandByScalar( boxMargin );

			if ( _ray.intersectsBox( _box ) === false ) {

				return;

			}

			if ( worldUnits ) {

				raycastWorldUnits( this, intersects );

			} else {

				raycastScreenSpace( this, camera, intersects );

			}

		}

	}

	LineSegments2.prototype.isLineSegments2 = true;

	THREE.LineSegments2 = LineSegments2;

} )();
( function () {

	class LineGeometry extends THREE.LineSegmentsGeometry {

		constructor() {

			super();
			this.type = 'LineGeometry';

		}

		setPositions( array ) {

			// converts [ x1, y1, z1,  x2, y2, z2, ... ] to pairs format
			const length = array.length - 3;
			const points = new Float32Array( 2 * length );

			for ( let i = 0; i < length; i += 3 ) {

				points[ 2 * i ] = array[ i ];
				points[ 2 * i + 1 ] = array[ i + 1 ];
				points[ 2 * i + 2 ] = array[ i + 2 ];
				points[ 2 * i + 3 ] = array[ i + 3 ];
				points[ 2 * i + 4 ] = array[ i + 4 ];
				points[ 2 * i + 5 ] = array[ i + 5 ];

			}

			super.setPositions( points );
			return this;

		}

		setColors( array ) {

			// converts [ r1, g1, b1,  r2, g2, b2, ... ] to pairs format
			const length = array.length - 3;
			const colors = new Float32Array( 2 * length );

			for ( let i = 0; i < length; i += 3 ) {

				colors[ 2 * i ] = array[ i ];
				colors[ 2 * i + 1 ] = array[ i + 1 ];
				colors[ 2 * i + 2 ] = array[ i + 2 ];
				colors[ 2 * i + 3 ] = array[ i + 3 ];
				colors[ 2 * i + 4 ] = array[ i + 4 ];
				colors[ 2 * i + 5 ] = array[ i + 5 ];

			}

			super.setColors( colors );
			return this;

		}

		fromLine( line ) {

			const geometry = line.geometry;

			if ( geometry.isGeometry ) {

				console.error( 'THREE.LineGeometry no longer supports Geometry. Use THREE.BufferGeometry instead.' );
				return;

			} else if ( geometry.isBufferGeometry ) {

				this.setPositions( geometry.attributes.position.array ); // assumes non-indexed

			} // set colors, maybe


			return this;

		}

	}

	LineGeometry.prototype.isLineGeometry = true;

	THREE.LineGeometry = LineGeometry;

} )();



( function () {

	class Line2 extends THREE.LineSegments2 {

		constructor( geometry = new THREE.LineGeometry(), material = new THREE.LineMaterial( {
			color: Math.random() * 0xffffff
		} ) ) {

			super( geometry, material );
			this.type = 'Line2';

		}

	}

	Line2.prototype.isLine2 = true;

	THREE.Line2 = Line2;

} )();





( function () {

	const _start = new THREE.Vector3();

	const _end = new THREE.Vector3();

	class Wireframe extends THREE.Mesh {

		constructor( geometry = new THREE.LineSegmentsGeometry(), material = new THREE.LineMaterial( {
			color: Math.random() * 0xffffff
		} ) ) {

			super( geometry, material );
			this.type = 'Wireframe';

		} // for backwards-compatibility, but could be a method of THREE.LineSegmentsGeometry...


		computeLineDistances() {

			const geometry = this.geometry;
			const instanceStart = geometry.attributes.instanceStart;
			const instanceEnd = geometry.attributes.instanceEnd;
			const lineDistances = new Float32Array( 2 * instanceStart.count );

			for ( let i = 0, j = 0, l = instanceStart.count; i < l; i ++, j += 2 ) {

				_start.fromBufferAttribute( instanceStart, i );

				_end.fromBufferAttribute( instanceEnd, i );

				lineDistances[ j ] = j === 0 ? 0 : lineDistances[ j - 1 ];
				lineDistances[ j + 1 ] = lineDistances[ j ] + _start.distanceTo( _end );

			}

			const instanceDistanceBuffer = new THREE.InstancedInterleavedBuffer( lineDistances, 2, 1 ); // d0, d1

			geometry.setAttribute( 'instanceDistanceStart', new THREE.InterleavedBufferAttribute( instanceDistanceBuffer, 1, 0 ) ); // d0

			geometry.setAttribute( 'instanceDistanceEnd', new THREE.InterleavedBufferAttribute( instanceDistanceBuffer, 1, 1 ) ); // d1

			return this;

		}

	}

	Wireframe.prototype.isWireframe = true;

	THREE.Wireframe = Wireframe;

} )();







( function () {

	class WireframeGeometry2 extends THREE.LineSegmentsGeometry {

		constructor( geometry ) {

			super();
			this.type = 'WireframeGeometry2';
			this.fromWireframeGeometry( new THREE.WireframeGeometry( geometry ) ); // set colors, maybe

		}

	}

	WireframeGeometry2.prototype.isWireframeGeometry2 = true;

	THREE.WireframeGeometry2 = WireframeGeometry2;

} )();
