/**
 * See LICENSE file.
 *
 * Classes to solve and draw curves.
 * Curve is the superclass of
 *  + Bezier (quadric and cubic)
 *  + TODO: Catmull Rom
 *
 *
 **/

(function() {
    /**
     *
     * Curve class is the base for all curve solvers available in CAAT.
     *
     * @constructor
     */
	CAAT.Curve= function() {
		return this;
	};
	
	CAAT.Curve.prototype= {
		coordlist:		null,
		k:				0.05,
		length:			-1,
		interpolator:	false,
		HANDLE_SIZE:	20,
		drawHandles:	true,

        /**
         * Paint the curve control points.
         * @param director {CAAT.Director}
         */
		paint: function(director) {
            if ( false===this.drawHandles ) {
                return;
            }

			var ctx= director.ctx;
		
			// control points
			ctx.save();
			ctx.beginPath();
			
			ctx.strokeStyle='#a0a0a0';
			ctx.moveTo( this.coordlist[0].x, this.coordlist[0].y );
			ctx.lineTo( this.coordlist[1].x, this.coordlist[1].y );
			ctx.stroke();
			if ( this.cubic ) {
				ctx.moveTo( this.coordlist[2].x, this.coordlist[2].y );
				ctx.lineTo( this.coordlist[3].x, this.coordlist[3].y );
				ctx.stroke();
			} 
			
            ctx.globalAlpha=0.5;
            for( var i=0; i<this.coordlist.length; i++ ) {
                ctx.fillStyle='#7f7f00';
                ctx.beginPath();
                ctx.arc(
                        this.coordlist[i].x,
                        this.coordlist[i].y,
                        this.HANDLE_SIZE/2,
                        0,
                        2*Math.PI,
                        false) ;
                ctx.fill();
            }

			ctx.restore();
		},
        /**
         * Signal the curve has been modified and recalculate curve length.
         */
		update : function() {
			this.calcLength();
		},
        /**
         * This method must be overriden by subclasses. It is called whenever the curve must be solved for some time=t.
         * The t parameter must be in the range 0..1
         * @param point {CAAT.Point} to store curve solution for t.
         * @param t {number}
         * @return {CAAT.Point} the point parameter.
         */
		solve: function(point,t) {
		},
        /**
         * Get an array of points defining the curve contour.
         * @param numSamples {number} number of segments to get.
         */
        getContour : function(numSamples) {
            var contour= [], i;

            for( i=0; i<=numSamples; i++ ) {
                var point= new CAAT.Point();
                this.solve( point, i/numSamples );
                contour.push(point);
            }

            return contour;
        },
        /**
         * Calculates a curve bounding box.
         *
         * @param rectangle {CAAT.Rectangle} a rectangle to hold the bounding box.
         * @return {CAAT.Rectangle} the rectangle parameter.
         */
		getBoundingBox : function(rectangle) {
			if ( !rectangle ) {
				rectangle= new CAAT.Rectangle();
			}

            // thanks yodesoft.com for spotting the first point is out of the BB
            rectangle.union( this.coordlist[0].x, this.coordlist[0].y );

			var pt= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(pt,t);
				rectangle.union( pt.x, pt.y );
			}			
			
			return rectangle;
		},
        /**
         * Calculate the curve length by incrementally solving the curve every substep=CAAT.Curve.k. This value defaults
         * to .05 so at least 20 iterations will be performed.
         *
         * @return {number} the approximate curve length.
         */
		calcLength : function() {
			var x1,x2,y1,y2;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			var llength=0;
			var pt= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(pt,t);
				llength+= Math.sqrt( (pt.x-x1)*(pt.x-x1) + (pt.y-y1)*(pt.y-y1) );
				x1=pt.x;
				y1=pt.y;
			}
			
			this.length= llength;
			return llength;
		},
        /**
         * Return the cached curve length.
         * @return {number} the cached curve length.
         */
		getLength : function() {
			return this.length;
		},
        /**
         * Return the first curve control point.
         * @param point {CAAT.Point}
         * @return {CAAT.Point}
         */
		endCurvePosition : function(point) {
			return this.coordlist[ this.coordlist.length-1 ];
		},
        /**
         * Return the last curve control point.
         * @param point {CAAT.Point}
         * @return {CAAT.Point}
         */
		startCurvePosition : function(point) {
			return this.coordlist[ 0 ];
		},

        setPoints : function( points ) {
        },

        setPoint : function( point, index ) {
            if ( index>=0 && index<this.coordlist.length ) {
                this.coordlist[index]= point;
            }
        },
        applyAsPath : function( ctx ) {
        }
	};
})();


(function() {

    /**
     * Bezier quadric and cubic curves implementation.
     *
     * @constructor
     * @extends CAAT.Curve
     */
	CAAT.Bezier= function() {
		CAAT.Bezier.superclass.constructor.call(this);
		return this;
	};
	
	CAAT.Bezier.prototype= {
		
		cubic:		false,

        applyAsPath : function( ctx ) {

            var cc= this.coordlist;

            if ( this.cubic ) {
                ctx.bezierCurveTo(
                    cc[1].x,
                    cc[1].y,
                    cc[2].x,
                    cc[2].y,
                    cc[3].x,
                    cc[3].y
                );
            } else {
                ctx.quadraticCurveTo(
                    this.cc[1].x,
                    this.cc[1].y,
                    this.cc[2].x,
                    this.cc[2].y
                );
            }
            return this;
        },
        isQuadric : function() {
            return !this.cubic;
        },
        isCubic : function() {
            return this.cubic;
        },
        /**
         * Set this curve as a cubic bezier defined by the given four control points.
         * @param cp0x {number}
         * @param cp0y {number}
         * @param cp1x {number}
         * @param cp1y {number}
         * @param cp2x {number}
         * @param cp2y {number}
         * @param cp3x {number}
         * @param cp3y {number}
         */
		setCubic : function( cp0x,cp0y, cp1x,cp1y, cp2x,cp2y, cp3x,cp3y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			this.coordlist.push( new CAAT.Point().set(cp3x, cp3y ) );
			
			this.cubic= true;
			this.update();

            return this;
		},
        /**
         * Set this curve as a quadric bezier defined by the three control points.
         * @param cp0x {number}
         * @param cp0y {number}
         * @param cp1x {number}
         * @param cp1y {number}
         * @param cp2x {number}
         * @param cp2y {number}
         */
		setQuadric : function(cp0x,cp0y, cp1x,cp1y, cp2x,cp2y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			
			this.cubic= false;
			this.update();

            return this;
		},
        setPoints : function( points ) {
            if ( points.length===3 ) {
                this.coordlist= points;
                this.cubic= false;
                this.update();
            } else if (points.length===4 ) {
                this.coordlist= points;
                this.cubic= true;
                this.update();
            } else {
                throw 'points must be an array of 3 or 4 CAAT.Point instances.'
            }

            return this;
        },
        /**
         * Paint this curve.
         * @param director {CAAT.Director}
         */
		paint : function( director ) {
			if ( this.cubic ) {
				this.paintCubic(director);
			} else {
				this.paintCuadric( director );
			}
			
			CAAT.Bezier.superclass.paint.call(this,director);

		},
        /**
         * Paint this quadric Bezier curve. Each time the curve is drawn it will be solved again from 0 to 1 with
         * CAAT.Bezier.k increments.
         *
         * @param director {CAAT.Director}
         * @private
         */
		paintCuadric : function( director ) {
			var x1,y1;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var ctx= director.ctx;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				ctx.lineTo(point.x, point.y );
			}
			
			ctx.stroke();
			ctx.restore();
		
		},
        /**
         * Paint this cubic Bezier curve. Each time the curve is drawn it will be solved again from 0 to 1 with
         * CAAT.Bezier.k increments.
         *
         * @param director {CAAT.Director}
         * @private
         */
		paintCubic : function( director ) {

			var x1,y1;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var ctx= director.ctx;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				ctx.lineTo(point.x, point.y );
			}
			
			ctx.stroke();
			ctx.restore();
		},
        /**
         * Solves the curve for any given parameter t.
         * @param point {CAAT.Point} the point to store the solved value on the curve.
         * @param t {number} a number in the range 0..1
         */
		solve : function(point,t) {
			if ( this.cubic ) {
				return this.solveCubic(point,t);
			} else {
				return this.solveQuadric(point,t);
			}
		},
        /**
         * Solves a cubic Bezier.
         * @param point {CAAT.Point} the point to store the solved value on the curve.
         * @param t {number} the value to solve the curve for.
         */
		solveCubic : function(point,t) {
			
			var t2= t*t;
			var t3= t*t2;

            var cl= this.coordlist;

			point.x=(cl[0].x + t * (-cl[0].x * 3 + t * (3 * cl[0].x-
					cl[0].x*t)))+t*(3*cl[1].x+t*(-6*cl[1].x+
					cl[1].x*3*t))+t2*(cl[2].x*3-cl[2].x*3*t)+
					cl[3].x * t3;
				
			point.y=(
                    cl[0].y+t*(-cl[0].y*3+t*(3*cl[0].y-
					cl[0].y*t)))+t*(3*cl[1].y+t*(-6*cl[1].y+
					cl[1].y*3*t))+t2*(cl[2].y*3-cl[2].y*3*t)+
					cl[3].y * t3;
			
			return point;
		},
        /**
         * Solves a quadric Bezier.
         * @param point {CAAT.Point} the point to store the solved value on the curve.
         * @param t {number} the value to solve the curve for.
         */
		solveQuadric : function(point,t) {
            var cl= this.coordlist;
			point.x= (1-t)*(1-t)*cl[0].x + 2*(1-t)*t*cl[1].x + t*t*cl[2].x;
			point.y= (1-t)*(1-t)*cl[0].y + 2*(1-t)*t*cl[1].y + t*t*cl[2].y;
			
			return point;
		}
	};

    extend(CAAT.Bezier, CAAT.Curve, null);
	
})();

(function() {

    /**
     * CatmullRom curves solver implementation.
     * <p>
     * <strong>Incomplete class, do not use.</strong>
     *
     * @constructor
     * @extends CAAT.Curve
     */
	CAAT.CatmullRom = function() {
		CAAT.CatmullRom.superclass.constructor.call(this);
		return this;
	};
	
	CAAT.CatmullRom.prototype= {

        /**
         * Set curve control points.
         * @param cp0x {number}
         * @param cp0y {number}
         * @param cp1x {number}
         * @param cp1y {number}
         * @param cp2x {number}
         * @param cp2y {number}
         * @param cp3x {number}
         * @param cp3y {number}
         */
		setCurve : function( cp0x,cp0y, cp1x,cp1y, cp2x,cp2y, cp3x,cp3y ) {
		
			this.coordlist= [];
		
			this.coordlist.push( new CAAT.Point().set(cp0x, cp0y ) );
			this.coordlist.push( new CAAT.Point().set(cp1x, cp1y ) );
			this.coordlist.push( new CAAT.Point().set(cp2x, cp2y ) );
			this.coordlist.push( new CAAT.Point().set(cp3x, cp3y ) );
			
			this.cubic= true;
			this.update();
		},
        /**
         * Paint the contour by solving again the entire curve.
         * @param director {CAAT.Director}
         */
		paint: function(director) {
			
			var x1,x2,y1,y2;
			x1 = this.coordlist[0].x;
			y1 = this.coordlist[0].y;
			
			var ctx= director.ctx;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			
			var point= new CAAT.Point();
			
			for(var t=this.k;t<=1+this.k;t+=this.k){
				this.solve(point,t);
				ctx.lineTo(point.x,point.y);
			}
			
			ctx.stroke();
			ctx.restore();
			
			CAAT.CatmullRom.superclass.paint.call(this,director);
		},
        /**
         * Solves the curve for any given parameter t.
         * @param point {CAAT.Point} the point to store the solved value on the curve.
         * @param t {number} a number in the range 0..1
         */
		solve: function(point,t) {
			var t2= t*t;
			var t3= t*t2;
		
			var c= this.coordlist;

//			q(t) = 0.5 *(  	(2 * P1) +
//				 	(-P0 + P2) * t +
//				(2*P0 - 5*P1 + 4*P2 - P3) * t2 +
//				(-P0 + 3*P1- 3*P2 + P3) * t3)

			point.x= 0.5*( (2*c[1].x) + (-c[0].x+c[2].x)*t + (2*c[0].x - 5*c[1].x + 4*c[2].x - c[3].x)*t2 + (-c[0].x + 3*c[1].x - 3*c[2].x + c[3].x)*t3 );
			point.y= 0.5*( (2*c[1].y) + (-c[0].y+c[2].y)*t + (2*c[0].y - 5*c[1].y + 4*c[2].y - c[3].y)*t2 + (-c[0].y + 3*c[1].y - 3*c[2].y + c[3].y)*t3 );
			
			return point;

		}
	};

    extend(CAAT.CatmullRom, CAAT.Curve, null);
})();