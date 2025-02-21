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
router.route("/add-comment/:parentId").post(verifyJWT, addComment)
router.route("/update-comment/:parentId/:commentId").patch(verifyJWT, updateComment)
router.route("/delete-comment/:parentId/:commentId").delete(verifyJWT, deleteComment)


// not secure routes
router.route("/get-video-comments/:parentId").get(getVideoComments)



export default router