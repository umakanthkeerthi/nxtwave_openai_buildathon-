import React from 'react';
import HealthHero from '../components/HealthHero';
import DocTools from '../components/DocTools';
import DocAITools from '../components/DocAITools';
import { motion } from 'framer-motion';

const Home = () => {
    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ paddingBottom: '2rem' }}
        >
            {/* New Hero Section */}
            <motion.div variants={item}>
                <HealthHero />
            </motion.div>

            {/* Quick Tools Grid below */}
            <motion.div variants={item}>
                <DocTools />
            </motion.div>

            {/* DocAI Tools Section */}
            <motion.div variants={item}>
                <DocAITools />
            </motion.div>
        </motion.div>
    );
};

export default Home;
