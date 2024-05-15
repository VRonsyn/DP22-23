import express from "express";
import { morganMiddleware } from "./middleware/morgan";
import { homeRouter } from "./middleware/routers/home";
import { questionRouter } from "./middleware/routers/profile/Question";
import { surveyRouter } from "./middleware/routers/profile/Survey";
import jwtCheck from "./middleware/authentication";
import { answerOptionRouter } from "./middleware/routers/profile/AnswerOption";
import { accountRouter } from "./middleware/routers/account";
import { childRouter } from "./middleware/routers/child";
import helmet from "helmet";
import { submittedSurveyRouter } from "./middleware/routers/profile/SubmittedSurvey";
import { activityRouter } from "./middleware/routers/activity/Activity";
import { taskRouter } from "./middleware/routers/activity/Task";
import { submittedSurveyAnswerRouter } from "./middleware/routers/profile/SubmittedSurveyAnswer";
import { externalCalendarRouter } from "./middleware/routers/account/ExternalCalendar";
import { templateRouter } from "./middleware/routers/activity/Template";
import { taskProgressRouter } from "./middleware/routers/activity/TaskProgress";
import { clarificationImageRouter } from "./middleware/routers/activity/ClarificationImage";
import { icalRouter } from "./middleware/routers/activity/ical";

export const app = express();
app.use(helmet());

// Add the morgan middleware
app.use(morganMiddleware);

app.use(express.static("public"));

app.use(icalRouter);

app.use(jwtCheck);

app.use(
  answerOptionRouter,
  submittedSurveyAnswerRouter,
  questionRouter,
  surveyRouter,
  accountRouter,
  submittedSurveyRouter,
  homeRouter,
  childRouter,
  activityRouter,
  taskRouter,
  taskProgressRouter,
  templateRouter,
  clarificationImageRouter,
  externalCalendarRouter
);
