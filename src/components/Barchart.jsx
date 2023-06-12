import * as d3 from "d3";
import { useEffect, useRef } from "react";

const Barchart = () => {
    const ref = useRef();

    function radar_visualization(config) {

        // custom random number generator, to make random sequence reproducible
        // source: https://stackoverflow.com/questions/521295
        var seed = 42;
        function random() {
            var x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        function random_between(min, max) {
            return min + random() * (max - min);
        }

        function normal_between(min, max) {
            return min + (random() + random()) * 0.5 * (max - min);
        }

        // radial_min / radial_max are multiples of PI
        const quadrants = [
            { radial_min: 0, radial_max: 0.5, factor_x: 1, factor_y: 1 },
            { radial_min: 0.5, radial_max: 1, factor_x: -1, factor_y: 1 },
            { radial_min: -1, radial_max: -0.5, factor_x: -1, factor_y: -1 },
            { radial_min: -0.5, radial_max: 0, factor_x: 1, factor_y: -1 }
        ];

        const rings = [
            { radius: 130 },
            { radius: 220 },
            { radius: 310 },
            { radius: 400 }
        ];

        const title_offset =
            { x: -675, y: -420 };

        const footer_offset =
            { x: -675, y: 790 };

        // responsive footer const
        const respon_footer_offset =
            { x: -675, y: 420 };

        const legend_offset = [
            { x: -675, y: 290 },
            { x: -675, y: -10 },
            { x: -675, y: -310 },
            { x: -675, y: 590 }
        ];

        // responsive legend const
        const respon_legend_offset = [
            { x: 450, y: 90 },
            { x: -675, y: 90 },
            { x: -675, y: -310 },
            { x: 450, y: -310 }
        ]

        function polar(cartesian) {
            var x = cartesian.x;
            var y = cartesian.y;
            return {
                t: Math.atan2(y, x),
                r: Math.sqrt(x * x + y * y)
            }
        }

        function cartesian(polar) {
            return {
                x: polar.r * Math.cos(polar.t),
                y: polar.r * Math.sin(polar.t)
            }
        }

        function bounded_interval(value, min, max) {
            var low = Math.min(min, max);
            var high = Math.max(min, max);
            return Math.min(Math.max(value, low), high);
        }

        function bounded_ring(polar, r_min, r_max) {
            return {
                t: polar.t,
                r: bounded_interval(polar.r, r_min, r_max)
            }
        }

        function bounded_box(point, min, max) {
            return {
                x: bounded_interval(point.x, min.x, max.x),
                y: bounded_interval(point.y, min.y, max.y)
            }
        }

        function segment(quadrant, ring) {
            var polar_min = {
                t: quadrants[quadrant].radial_min * Math.PI,
                r: ring === 0 ? 30 : rings[ring - 1].radius
            };
            var polar_max = {
                t: quadrants[quadrant].radial_max * Math.PI,
                r: rings[ring].radius
            };
            var cartesian_min = {
                x: 15 * quadrants[quadrant].factor_x,
                y: 15 * quadrants[quadrant].factor_y
            };
            var cartesian_max = {
                x: rings[3].radius * quadrants[quadrant].factor_x,
                y: rings[3].radius * quadrants[quadrant].factor_y
            };
            return {
                clipx: function (d) {
                    var c = bounded_box(d, cartesian_min, cartesian_max);
                    var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
                    d.x = cartesian(p).x; // adjust data too!
                    return d.x;
                },
                clipy: function (d) {
                    var c = bounded_box(d, cartesian_min, cartesian_max);
                    var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
                    d.y = cartesian(p).y; // adjust data too!
                    return d.y;
                },
                random: function () {
                    return cartesian({
                        t: random_between(polar_min.t, polar_max.t),
                        r: normal_between(polar_min.r, polar_max.r)
                    });
                }
            }
        }

        // position each entry randomly in its segment
        for (var i = 0; i < config.entries.length; i++) {
            var entry = config.entries[i];
            entry.segment = segment(entry.quadrant, entry.ring);
            var point = entry.segment.random();
            entry.x = point.x;
            entry.y = point.y;
            entry.color = entry.active || config.print_layout ?
                config.rings[entry.ring].color : config.colors.inactive;
        }

        // partition entries according to segments
        var segmented = new Array(4);
        for (var quadrant = 0; quadrant < 4; quadrant++) {
            segmented[quadrant] = new Array(4);
            for (var ring = 0; ring < 4; ring++) {
                segmented[quadrant][ring] = [];
            }
        }
        for (var i = 0; i < config.entries.length; i++) {
            var entry = config.entries[i];
            segmented[entry.quadrant][entry.ring].push(entry);
        }

        // assign unique sequential id to each entry
        var id = 1;
        for (var quadrant of [2, 3, 1, 0]) {
            for (var ring = 0; ring < 4; ring++) {
                var entries = segmented[quadrant][ring];
                entries.sort(function (a, b) { return a.label.localeCompare(b.label); })
                for (var i = 0; i < entries.length; i++) {
                    entries[i].id = "" + id++;
                }
            }
        }

        function translate(x, y) {
            return "translate(" + x + "," + y + ")";
        }

        function viewbox(quadrant) {
            return [
                Math.max(0, quadrants[quadrant].factor_x * 400) - 420,
                Math.max(0, quadrants[quadrant].factor_y * 400) - 420,
                440,
                440
            ].join(" ");
        }

        var svg = d3.select("svg#" + config.svg_id)
            .style("background-color", config.colors.background)
            .style("width", `${config.width}`)
            .style("height", `${config.height}`);

        var radar = svg.append("g");
        if ("zoomed_quadrant" in config) {
            svg.attr("viewBox", viewbox(config.zoomed_quadrant));
        } else {
            radar.attr("transform", translate(config.width / 2, config.height / 2));
            // radar.style("transform", `translate(${config.width / 2}, ${config.height / 2})`);
        }

        var grid = radar.append("g");

        /**
         * @method: draw grid lines
         * 
        */
        // draw grid lines
        grid.append("line")
            .attr("x1", 0).attr("y1", -400)
            .attr("x2", 0).attr("y2", 400)
            .style("stroke", config.colors.grid)
            .style("stroke-width", 1);
        grid.append("line")
            .attr("x1", -400).attr("y1", 0)
            .attr("x2", 400).attr("y2", 0)
            .style("stroke", config.colors.grid)
            .style("stroke-width", 1);

        // background color. Usage `.attr("filter", "url(#solid)")`
        // SOURCE: https://stackoverflow.com/a/31013492/2609980
        var defs = grid.append("defs");
        var filter = defs.append("filter")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1)
            .attr("height", 1)
            .attr("id", "solid");
        filter.append("feFlood")
            .attr("flood-color", "rgb(0, 0, 0, 0.8)");
        filter.append("feComposite")
            .attr("in", "SourceGraphic");

        /**
         * @method: draw background rings
         * 
        */
        // draw rings
        for (var i = 0; i < rings.length; i++) {
            grid.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", rings[i].radius)
                .style("fill", "none")
                .style("stroke", config.colors.grid)
                .style("stroke-width", 1);
            if (config.print_layout) {
                grid.append("text")
                    .text(config.rings[i].name)
                    .attr("y", -rings[i].radius + 62)
                    .attr("text-anchor", "middle")
                    .style("fill", config.rings[i].color)
                    .style("opacity", 0.35)
                    .style("font-family", "Arial, Helvetica")
                    .style("font-size", "42px")
                    .style("font-weight", "bold")
                    .style("pointer-events", "none")
                    .style("user-select", "none");
            }
        }

        function legend_transform(quadrant, ring, index = null) {
            var dx = ring < 2 ? 0 : 140;
            var dy = (index == null ? -16 : index * 12);
            if (ring % 2 === 1) {
                dy = dy + 36 + segmented[quadrant][ring - 1].length * 12;
            }
            // Response for phone
            if (window.innerWidth > 510) {
                var res = translate(
                    respon_legend_offset[quadrant].x + dx + 'px',
                    respon_legend_offset[quadrant].y + dy + 'px'
                );
            } else {
                var res = translate(
                    legend_offset[quadrant].x + dx + 'px',
                    legend_offset[quadrant].y + dy + 'px'
                );
            }
            return res;
        }

        // draw title and legend (only in print layout)
        if (config.print_layout) {

            // title
            radar.append("text")
                .attr("transform", translate(title_offset.x, title_offset.y))
                .text(config.title)
                .style("font-family", "Arial, Helvetica")
                .style("font-size", "30")
                .style("font-weight", "bold")

            // date
            radar
                .append("text")
                .attr("transform", translate(title_offset.x, title_offset.y + 20))
                .text(config.date || "")
                .style("font-family", "Arial, Helvetica")
                .style("font-size", "14")
                .style("fill", "#999")

            // footer
            radar.append("text")
                .attr("transform", translate(window.innerWidth > 510 ? respon_footer_offset.x : footer_offset.x, window.innerWidth > 510 ? respon_footer_offset.y : footer_offset.y))
                .text("▲ moved up     ▼ moved down")
                .attr("xml:space", "preserve")
                .style("font-family", "Arial, Helvetica")
                .style("font-size", "10px");

            // legend
            var legend = radar.append("g");
            for (var quadrant = 0; quadrant < 4; quadrant++) {
                legend.append("text")
                    // .attr("transform", translate(
                    //   legend_offset[quadrant].x,
                    //   legend_offset[quadrant].y - 45
                    // ))
                    .text(config.quadrants[quadrant].name)
                    // Response for phone
                    .style("transform", `translate(${window.innerWidth > 510 ? (respon_legend_offset[quadrant].x) : (legend_offset[quadrant].x)}px, ${window.innerWidth > 510 ? (respon_legend_offset[quadrant].y - 45) : (legend_offset[quadrant].y - 45)}px)`)
                    .style("font-family", "Arial, Helvetica")
                    .style("font-size", "18px")
                    .style("font-weight", "bold");
                for (var ring = 0; ring < 4; ring++) {
                    legend.append("text")
                        // .attr("transform", legend_transform(quadrant, ring))
                        .style("transform", legend_transform(quadrant, ring))
                        .text(config.rings[ring].name)
                        .style("font-family", "Arial, Helvetica")
                        .style("font-size", "12px")
                        .style("font-weight", "bold")
                        .style("fill", config.rings[ring].color);
                    legend.selectAll(".legend" + quadrant + ring)
                        .data(segmented[quadrant][ring])
                        .enter()
                        .append("a")
                        .attr("href", function (d, i) {
                            return d.link ? d.link : "#"; // stay on same page if no link was provided
                        })
                        // Add a target if (and only if) there is a link and we want new tabs
                        .attr("target", function (d, i) {
                            return (d.link && config.links_in_new_tabs) ? "_blank" : null;
                        })
                        .append("text")
                        .style("transform", function (d, i) { return legend_transform(quadrant, ring, i); })
                        .attr("class", "legend" + quadrant + ring)
                        .attr("id", function (d, i) { return "legendItem" + d.id; })
                        .text(function (d, i) { return d.id + ". " + d.label; })
                        .style("font-family", "Arial, Helvetica")
                        .style("font-size", "11px")
                    // .on("mouseover", function (d) { showBubble(d); highlightLegendItem(d); })
                    // .on("mouseout", function (d) { hideBubble(d); unhighlightLegendItem(d); });
                }
            }
        }

        // layer for entries
        var rink = radar.append("g")
            .attr("id", "rink");

        // rollover bubble (on top of everything else)
        var bubble = radar.append("g")
            .attr("id", "bubble")
            .attr("x", 0)
            .attr("y", 0)
            .style("opacity", 0)
            .style("pointer-events", "none")
            .style("user-select", "none");
        bubble.append("rect")
            .attr("rx", 4)
            .attr("ry", 4)
            .style("fill", "#333");
        bubble.append("text")
            .style("font-family", "sans-serif")
            .style("font-size", "10px")
            .style("fill", "#fff");
        bubble.append("path")
            .attr("d", "M 0,0 10,0 5,8 z")
            .style("fill", "#333");

        function showBubble(d) {
            if (d.active || config.print_layout) {
                var tooltip = d3.select("#bubble text")
                    .text(d.label);
                var bbox = tooltip.node().getBBox();
                d3.select("#bubble")
                    .attr("transform", translate(d.x - bbox.width / 2, d.y - 16))
                    .style("opacity", 0.8);
                d3.select("#bubble rect")
                    .attr("x", -5)
                    .attr("y", -bbox.height)
                    .attr("width", bbox.width + 10)
                    .attr("height", bbox.height + 4);
                d3.select("#bubble path")
                    .attr("transform", translate(bbox.width / 2 - 5, 3));
            }
        }

        function hideBubble(d) {
            var bubble = d3.select("#bubble")
                .attr("transform", translate(0, 0))
                .style("opacity", 0);
        }

        function highlightLegendItem(d) {
            var legendItem = document.getElementById("legendItem" + d.id);
            legendItem.setAttribute("filter", "url(#solid)");
            legendItem.setAttribute("fill", "white");
        }

        function unhighlightLegendItem(d) {
            var legendItem = document.getElementById("legendItem" + d.id);
            legendItem.removeAttribute("filter");
            legendItem.removeAttribute("fill");
        }

        // draw blips on radar
        var blips = rink.selectAll(".blip")
            .data(config.entries)
            .enter()
            .append("g")
            .attr("class", "blip")
            .style("transform", `${function (d, i) { return legend_transform(d.quadrant, d.ring, i); }}`)
        // .on("mouseover", function (d) { showBubble(d); highlightLegendItem(d); })
        // .on("mouseout", function (d) { hideBubble(d); unhighlightLegendItem(d); });

        // configure each blip
        blips.each(function (d) {
            var blip = d3.select(this);

            // blip link
            if (d.active && d.hasOwnProperty("link") && d.link) {
                blip = blip.append("a")
                    .attr("xlink:href", d.link);

                if (config.links_in_new_tabs) {
                    blip.attr("target", "_blank");
                }
            }

            // blip shape
            if (d.moved > 0) {
                blip.append("path")
                    .attr("d", "M -11,5 11,5 0,-13 z") // triangle pointing up
                    .style("fill", d.color);
            } else if (d.moved < 0) {
                blip.append("path")
                    .attr("d", "M -11,-5 11,-5 0,13 z") // triangle pointing down
                    .style("fill", d.color);
            } else {
                blip.append("circle")
                    .attr("r", 9)
                    .attr("fill", d.color);
            }

            // blip text
            if (d.active || config.print_layout) {
                var blip_text = config.print_layout ? d.id : d.label.match(/[a-z]/i);
                blip.append("text")
                    .text(blip_text)
                    .attr("y", 3)
                    .attr("text-anchor", "middle")
                    .style("fill", "#fff")
                    .style("font-family", "Arial, Helvetica")
                    .style("font-size", function (d) { return blip_text.length > 2 ? "8px" : "9px"; })
                    .style("pointer-events", "none")
                    .style("user-select", "none");
            }
        });

        // make sure that blips stay inside their segment
        function ticked() {
            blips.attr("transform", function (d) {
                return translate(d.segment.clipx(d), d.segment.clipy(d));
            })
        }

        // distribute blips, while avoiding collisions
        d3.forceSimulation()
            .nodes(config.entries)
            .velocityDecay(0.19) // magic number (found by experimentation)
            .force("collision", d3.forceCollide().radius(12).strength(0.85))
            .on("tick", ticked);
    }

    useEffect(() => {
        const entries = [
            {
                quadrant: 3,
                ring: 2,
                label: "AWS Athena",
                active: true,
                moved: 0,
                desc: "<p>We keep getting good feedback from teams <strong>applying product management to internal platforms</strong>. One key feature to remember, though: It's not just about team structure or renaming existing platform teams; it’s also about applying product-centric working practices within the team. Specifically, we've received feedback that teams face challenges with this technique unless they have a product-centric mindset. This likely means additional roles, such as a product manager, alongside changes to other areas, such as requirements gathering and the measurement of success. Working this way means establishing empathy with internal consumers (the development teams) and collaborating with them on the design. Platform product managers create roadmaps and ensure the platform delivers value to the business and enhances the developer experience. We continue to see this technique as key to building internal platforms to roll out new digital solutions quickly and efficiently.</p>",
            },
            {
                quadrant: 3,
                ring: 3,
                label: "AWS Data Pipeline",
                active: true,
                moved: 0,
                desc: "<p>One of the many places in the software delivery process to consider accessibility requirements early on is during web component testing. Testing framework plugins like chai-a11y-axe provide assertions in their API to check for the basics. But in addition to using what testing frameworks have to offer, <strong>accessibility-aware component test design</strong> further helps to provide all the semantic elements needed by screen readers and other assistive technologies.</p><p>Firstly, instead of using test ids or classes to find and select the elements you want to validate, use a principle of identifying elements by ARIA roles or other semantic attributes that are used by assistive technologies. Some testing libraries, like Testing Library, even recommend this in their documentation. Secondly, do not just test for click interactions; also consider users who cannot use a mouse or see the screen, and consider adding additional tests for the keyboard and other interactions.</p>",
            },
            {
                quadrant: 3,
                ring: 0,
                label: "AWS EMR",
                active: true,
                moved: 0,
                desc: "<p>We keep getting good feedback from teams <strong>applying product management to internal platforms</strong>. One key feature to remember, though: It's not just about team structure or renaming existing platform teams; it’s also about applying product-centric working practices within the team. Specifically, we've received feedback that teams face challenges with this technique unless they have a product-centric mindset. This likely means additional roles, such as a product manager, alongside changes to other areas, such as requirements gathering and the measurement of success. Working this way means establishing empathy with internal consumers (the development teams) and collaborating with them on the design. Platform product managers create roadmaps and ensure the platform delivers value to the business and enhances the developer experience. We continue to see this technique as key to building internal platforms to roll out new digital solutions quickly and efficiently.</p>",
            },
            {
                quadrant: 3,
                ring: 2,
                label: "AWS Glue",
                active: true,
                moved: 0,
                desc: "<p>We keep getting good feedback from teams <strong>applying product management to internal platforms</strong>. One key feature to remember, though: It's not just about team structure or renaming existing platform teams; it’s also about applying product-centric working practices within the team. Specifically, we've received feedback that teams face challenges with this technique unless they have a product-centric mindset. This likely means additional roles, such as a product manager, alongside changes to other areas, such as requirements gathering and the measurement of success. Working this way means establishing empathy with internal consumers (the development teams) and collaborating with them on the design. Platform product managers create roadmaps and ensure the platform delivers value to the business and enhances the developer experience. We continue to see this technique as key to building internal platforms to roll out new digital solutions quickly and efficiently.</p>",
            },
            {
                quadrant: 3,
                ring: 0,
                label: "Airflow",
                active: true,
                moved: 0,
                desc: "<p>We keep getting good feedback from teams <strong>applying product management to internal platforms</strong>. One key feature to remember, though: It's not just about team structure or renaming existing platform teams; it’s also about applying product-centric working practices within the team. Specifically, we've received feedback that teams face challenges with this technique unless they have a product-centric mindset. This likely means additional roles, such as a product manager, alongside changes to other areas, such as requirements gathering and the measurement of success. Working this way means establishing empathy with internal consumers (the development teams) and collaborating with them on the design. Platform product managers create roadmaps and ensure the platform delivers value to the business and enhances the developer experience. We continue to see this technique as key to building internal platforms to roll out new digital solutions quickly and efficiently.</p>",
            },
            {
                quadrant: 3,
                ring: 0,
                label: "Databricks",
                active: true,
                moved: 0,
                desc: "<p>We keep getting good feedback from teams <strong>applying product management to internal platforms</strong>. One key feature to remember, though: It's not just about team structure or renaming existing platform teams; it’s also about applying product-centric working practices within the team. Specifically, we've received feedback that teams face challenges with this technique unless they have a product-centric mindset. This likely means additional roles, such as a product manager, alongside changes to other areas, such as requirements gathering and the measurement of success. Working this way means establishing empathy with internal consumers (the development teams) and collaborating with them on the design. Platform product managers create roadmaps and ensure the platform delivers value to the business and enhances the developer experience. We continue to see this technique as key to building internal platforms to roll out new digital solutions quickly and efficiently.</p>",
            },
            {
                quadrant: 3,
                ring: 1,
                label: "Flink",
                link: "https://engineering.zalando.com/tags/apache-flink.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 1,
                label: "Google BigQuery",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 3,
                label: "Hadoop",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 1,
                label: "Presto",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 0,
                label: "Spark",
                link: "https://engineering.zalando.com/tags/apache-spark.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 3,
                label: "YARN",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 2,
                label: "dbt",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 0,
                label: "AWS DynamoDB",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 0,
                label: "AWS S3",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "Aerospike",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 2,
                label: "Amazon MemoryDB",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 1,
                label: "Amazon Redshift",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 1,
                label: "Amazon Feature Store",
                active: true,
                moved: 1,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "Apache Cassandra",
                link: "https://engineering.zalando.com/tags/cassandra.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "Consul",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "CouchBase",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 1,
                label: "Druid",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 0,
                label: "Elasticsearch",
                link: "https://engineering.zalando.com/tags/elasticsearch.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 0,
                label: "Exasol",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "HBase",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 1,
                label: "HDFS",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "Hazelcast",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "Memcached",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "MongoDB",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "MySQL",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "Oracle DB",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 0,
                label: "PostgreSQL",
                link: "https://engineering.zalando.com/tags/postgresql.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 0,
                label: "Redis",
                link: "https://engineering.zalando.com/tags/redis.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 2,
                label: "RocksDB",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "Solr",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 3,
                label: "ZooKeeper",
                active: true,
                moved: 0,
            },
            {
                quadrant: 2,
                ring: 0,
                label: "etcd",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 0,
                label: "AWS CloudFormation",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 0,
                label: "AWS CloudFront",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 1,
                label: "AWS Elemental MediaConvert",
                active: true,
                moved: 1,
            },
            {
                quadrant: 1,
                ring: 1,
                label: "AWS Lambda",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 1,
                label: "AWS Step Functions",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 0,
                label: "Amazon SageMaker",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 0,
                label: "Docker",
                link: "https://engineering.zalando.com/tags/docker.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 0,
                label: "Kubernetes",
                link: "https://engineering.zalando.com/tags/kubernetes.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 0,
                label: "OpenTracing",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 3,
                label: "STUPS",
                link: "https://engineering.zalando.com/tags/stups.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 0,
                label: "Skipper",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 2,
                label: "Slurm",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 2,
                label: "WebAssembly",
                active: true,
                moved: 0,
            },
            {
                quadrant: 1,
                ring: 3,
                label: "ZMON",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 3,
                label: "Clojure",
                link: "https://engineering.zalando.com/tags/clojure.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 1,
                label: "Dart",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "Go",
                link: "https://engineering.zalando.com/tags/golang.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "GraphQL",
                link: "https://engineering.zalando.com/tags/graphql.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 3,
                label: "Haskell",
                link: "https://engineering.zalando.com/tags/haskell.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "Java",
                link: "https://engineering.zalando.com/tags/java.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "JavaScript",
                link: "https://engineering.zalando.com/tags/javascript.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "Kotlin",
                link: "https://engineering.zalando.com/tags/kotlin.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "OpenAPI (Swagger)",
                link: "https://engineering.zalando.com/tags/openapi.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "Python",
                link: "https://engineering.zalando.com/tags/python.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 2,
                label: "R",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 3,
                label: "Rust",
                link: "https://engineering.zalando.com/tags/rust.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "Scala",
                link: "https://engineering.zalando.com/tags/scala.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "Swift",
                link: "https://engineering.zalando.com/tags/swift.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 0,
                ring: 0,
                label: "TypeScript",
                link: "https://engineering.zalando.com/tags/typescript.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 0,
                label: "AWS Kinesis",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 0,
                label: "AWS SNS",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 0,
                label: "AWS SQS",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 0,
                label: "Kafka",
                link: "https://engineering.zalando.com/tags/apache-kafka.html",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 0,
                label: "Nakadi",
                link: "https://nakadi.io",
                active: true,
                moved: 0,
            },
            {
                quadrant: 3,
                ring: 1,
                label: "RabbitMQ",
                link: "https://engineering.zalando.com/tags/rabbitmq.html",
                active: true,
                moved: 0,
            },
        ];
        radar_visualization({
            svg_id: "radar",
            width: 1450,
            height: 1000,
            colors: {
                background: "#fff",
                grid: "#dddde0",
                inactive: "#ddd",
            },
            title: "Zalando Tech Radar",
            date: "2023.02",
            quadrants: [
                { name: "Languages" },
                { name: "Infrastructure" },
                { name: "Datastores" },
                { name: "Data Management" },
            ],
            rings: [
                { name: "ADOPT", color: "#5ba300" },
                { name: "TRIAL", color: "#009eb0" },
                { name: "ASSESS", color: "#c7ba00" },
                { name: "HOLD", color: "#e09b96" },
            ],
            print_layout: true,
            links_in_new_tabs: true,
            // zoomed_quadrant: 0,
            //ENTRIES
            entries,
        });

    }, []);

    return <svg id="radar" ref={ref} />;
};

export default Barchart;