import { Router } from 'express';
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router()


// secure routes
router.route("/add-comment/:videoId").post(verifyJWT, addComment)
router.route("/update-comment/:videoId/:commentId").patch(verifyJWT, updateComment)
router.route("/delete-comment/:videoId/:commentId").delete(verifyJWT, deleteComment)


// not secure routes
router.route("/get-video-comments/:videoId").get(getVideoComments)



export default router