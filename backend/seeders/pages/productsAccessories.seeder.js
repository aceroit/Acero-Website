const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });
}

const mongoose = require('mongoose');
const Page = require('../../models/Page');
const Section = require('../../models/Section');
const User = require('../../models/User');
const connectDB = require('../../configs/database');

const seedProductsAccessories = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Accessories product page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let productsPage = await Page.findOne({ slug: 'products' });
        if (!productsPage) throw new Error('Products parent page not found.');

        let page = await Page.findOne({ slug: 'accessories', parentId: productsPage._id });
        if (!page) {
            page = await Page.create({
                title: 'Steel Building Accessories',
                slug: 'accessories',
                path: '/products/accessories',
                parentId: productsPage._id,
                level: 1,
                order: 4,
                metaTitle: 'Steel Building Accessories | Acero Building Systems',
                metaDescription: 'Comprehensive range of steel building accessories including doors, windows, louvres, ventilators, and more.',
                metaKeywords: 'steel building accessories,doors,windows,louvres,ventilators',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Accessories page');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: { image: '/images/accessories/hero.jpg', title: 'Steel Building Accessories' },
            },
            {
                sectionTypeSlug: 'hover_card',
                order: 1,
                content: {
                    title: 'Steel Building Accessories',
                    subtitle: 'To learn more about steel building accessories, hover over the accessory image',
                    cards: [
                        { id: 'sandtrap-louvre', title: 'Sandtrap louvre', description: 'Sandtrap louvre is a specialized type of louvre designed to prevent the entry of sand and other debris into buildings or ventilation systems, particularly in areas where sandstorms or high winds are common. The design of the louver allows larger particles like sand to settle and accumulate at the bottom of the louvre, while allowing air to pass through relatively unimpeded.', image: '/images/accessories/sandtrap-louvre.jpg', imageAlt: 'Sandtrap louvre' },
                        { id: 'fixed-louvre', title: 'Fixed/Adjustable Louvre', description: 'Fixed louvre are openings provided with slanted fins to allow for the flow of air, may either be adjustable or fixed.', image: '/images/accessories/fixed-louvre.jpg', imageAlt: 'Fixed/Adjustable Louvre' },
                        { id: 'rollup-door', title: 'Rollup Door', description: 'Roll Up Door is a roll up door curtain made from steel and painted with a polyester paint. The bottom rail of the door curtain is an aluminum angle guide. The door drum, supporting the door curtain, houses safety springs, end shafts, collars and bearings. Doors are supplied either as manually or electrically operated, and are complete with guides, axles, curtains, a manual chain, and a reduction gear operating system.', image: '/images/accessories/rollup-door.jpg', imageAlt: 'Rollup Door' },
                        { id: 'framed-opening', title: 'Framed Opening', description: 'Framing (headers, sills, and jambs) and flashing which surround an opening in a building. Usually provided to accommodate field installed accessories such as sliding doors, roll-up doors, etc.', image: '/images/accessories/framed-opening.jpg', imageAlt: 'Framed Opening' },
                        { id: 'window', title: 'Window', description: 'Windows with the frame made of anodized or powder-coated aluminum extrusions are the horizontal half-slide type, specifically designed for installation in profiled exterior wall panels. Windows are factory-glazed with clear glass and are equipped with latches and removable insect screen.', image: '/images/accessories/window.jpg', imageAlt: 'Window' },
                        { id: 'sliding-door', title: 'Sliding Door', description: 'Sliding Doors are delivered unassembled for on-site assembly, including all necessary clips, fasteners and assembly items. The door leaf\'s exterior is sheeted with profiled panels matching the wall panel\'s profile and material. Doors are hung from an exterior-mounted trolley rail attached to a structural header beam. The door hood trim, supplied in the same material as the wall panel, conceals and protects the header and rail.', image: '/images/accessories/sliding-door.jpg', imageAlt: 'Sliding Door' },
                        { id: 'personnel-door', title: 'Personnel Door', description: 'Personnel Doors are flush finished and can be single leaf doors or double leaf doors. Doors are reinforced, stiffened and sound deadened with an expanded polystyrene core, laminated to the inside faces of door panels, completely filling the inside cavity of the door leaf, they are factory prepared for a cylindrical lockset and door frames are delivered knocked down.', image: '/images/accessories/personnel-door.jpg', imageAlt: 'Personnel Door' },
                        { id: 'sectional-door', title: 'Sectional Door', description: 'Sectional door, also known as a sectional overhead door, is a type of garage door commonly used in residential, commercial, and industrial settings. It is composed of horizontal panels or sections hinged together, allowing the door to open and close vertically along tracks or rails. Sectional doors are known for their space-saving design, as they open vertically and do not swing outward like traditional hinged doors.', image: '/images/accessories/sectional-door.jpg', imageAlt: 'Sectional Door' },
                        { id: 'wall-light', title: 'Wall Light', description: 'Wall Lights are made from translucent white, acrylic modified, ultraviolet stabilized fiberglass. The profile of translucent panels matches that of the adjoining wall panels to ensure that weather resistant tightness is achieved through the same lapping technique used for the other panels.', image: '/images/accessories/wall-light.jpg', imageAlt: 'Wall Light' },
                        { id: 'sky-light', title: 'Sky Lights', description: 'Sky Lights are made from translucent white, acrylic modified, ultraviolet stabilized fiberglass. The profile of translucent panels matches that of the adjoining roof panels to ensure that weather resistant tightness is achieved through the same lapping technique used for the other panels.', image: '/images/accessories/sky-light.jpg', imageAlt: 'Sky Lights' },
                        { id: 'ventilator', title: 'Ventilator', description: 'Ventilators are a means of providing air change within a building.', image: '/images/accessories/ventilator.jpg', imageAlt: 'Ventilator' },
                        { id: 'bead-mastic', title: 'Bead Mastic, Flowable Mastic, and Tape', description: 'BEAD MASTIC is a butyl rubber-based sealant and supplied in rolls on silicon release paper. FLOWABLE MASTIC (caulking sealant) is a neutral silicone sealant that is chemically inert and non-corrosive. It is UV resistant and suitable for exterior applications against weathering and rainwater. When cured it is non-toxic and will accommodate high thermal and shrinkage changes in structural movement joints.', image: '/images/accessories/bead-mastic.jpg', imageAlt: 'Bead Mastic, Flowable Mastic, and Tape' },
                        { id: 'pop-rivets', title: 'Pop Rivets', description: 'Pop Rivets are used in gutter splicing, fixing trim to trim or trim to panel and fastening accessories to roof and wall panels.', image: '/images/accessories/pop-rivets.jpg', imageAlt: 'Pop Rivets' },
                        { id: 'self-drilling-screw', title: 'Self Drilling Screw (SDS)', description: 'Fasteners, used for attaching panels and trims to girts and purlins, which drill their own holes and eliminate the pre-drilling operation.', image: '/images/accessories/self-drilling-screw.jpg', imageAlt: 'Self Drilling Screw (SDS)' },
                        { id: 'pvc-pipe-accessories', title: 'PVC Pipe Accessories', description: 'PVC pipe accessories refer to a wide range of fittings and components that are used in conjunction with PVC (polyvinyl chloride) pipes for various plumbing, irrigation, and construction applications. These accessories are designed to connect, terminate, redirect, or control the flow of fluid or substances within a PVC piping system.', image: '/images/accessories/pvc-pipe-accessories.jpg', imageAlt: 'PVC Pipe Accessories' },
                        { id: 'foam-closures', title: 'Foam Closures', description: 'Foam Closures match the panel profile and are made from expanded polyurethane or similar material.', image: '/images/accessories/foam-closures.jpg', imageAlt: 'Foam Closures' },
                    ],
                    columns: 3,
                },
            },
        ];

        let sectionsCreated = 0;
        let sectionsUpdated = 0;

        for (const sectionData of sectionsData) {
            let section = await Section.findOne({
                pageId: page._id,
                sectionTypeSlug: sectionData.sectionTypeSlug,
                order: sectionData.order,
            });

            if (!section) {
                await Section.create({
                    pageId: page._id,
                    sectionTypeSlug: sectionData.sectionTypeSlug,
                    order: sectionData.order,
                    content: sectionData.content,
                    isVisible: true,
                    status: 'draft',
                    createdBy: user._id,
                });
                sectionsCreated++;
                console.log(`✓ Created section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug}`);
            } else {
                section.content = sectionData.content;
                await section.save();
                sectionsUpdated++;
                console.log(`✓ Updated section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug}`);
            }
        }

        console.log(`\n✓ Accessories page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedProductsAccessories();
module.exports = seedProductsAccessories;

