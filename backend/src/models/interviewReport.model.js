import mongoose from 'mongoose';


/**
 * - job description schema: String
 * - resume text: String
 * - self description: String

 * - matchScore: Number

 * - Technical questions :[{
        question: "",
        intention: "",
        answer: "",
    }]
 * - Behavioral questions :[{
        question: "",
        intention: "",
        answer: "",
    }]
 * - Skill gaps :[{
        skill: "",
        severity:{
        type : String,
        enum : ["low", "medium", "high"]
        }
    }]
 * - Prepration plan :[{
        day: Number,
        focus: String,
        tasks: [String]
    }]
 */


const technicalQuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        required: [true, "Technical question is required"]
    },
    intention:{
        type: String,
        required: [true, "Intention is required"]
    },
    answer:{
        type: String,
        required: [true, "Answer is required"]
    }
},{
    _id: false  
})

const behavioralQuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        required: [true, "Technical question is required"]
    },
    intention:{
        type: String,
        required: [true, "Intention is required"]
    },
    answer:{
        type: String,
        required: [true, "Answer is required"]
    }
},{
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill:{
        type: String,
        required: [true, "Skill is required"]
    },
    severity:{
        type: String,
        enum: ["low", "medium", "hight"],
        required: [true, "Severity is required"]
    }
},{
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day:{
        type: Number,
        required: [true, "Day is required"]
    },
    focus:{
        type: String,
        required: [true, "focus is required"]
    },
    tasks:{
        type: String,
        required: [true, "Task is required"]
    }
})

const interivewReportSchema = new mongoose.Schema({
    jobDescription:{
        type: String,
        required: [true, "Job description is required"]
    },
    resume:{
        type: String,
    },
    selfDescription:{
        type: String
    },
    matchScore:{
        type: Number,
        min: 0,
        max: 100
    },
    technicalQuestion: [ technicalQuestionSchema ],
    behavioralQuestion: [ behavioralQuestionSchema ],
    skillGaps: [ skillGapSchema ],
    preprationPlan: [ preparationPlanSchema ]
},{
    timestamps: true
})

export const interviewReportModel =  mongoose.model('interviewReportModel', interivewReportSchema); 