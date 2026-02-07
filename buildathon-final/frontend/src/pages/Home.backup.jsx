import React from 'react';
import DidYouKnow from '../components/DidYouKnow';
import SymptomEvaluator from '../components/SymptomEvaluator';
import DocTools from '../components/DocTools';
import { motion } from 'framer-motion';

const Home = () => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
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
        >
            <motion.div variants={item}>
                <DidYouKnow />
            </motion.div>

            <motion.div variants={item}>
                <SymptomEvaluator />
            </motion.div>

            <motion.div variants={item}>
                <DocTools />
            </motion.div>
        </motion.div>
    );
};

export default Home;
