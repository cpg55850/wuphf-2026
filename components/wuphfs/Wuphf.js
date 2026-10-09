import React, { useState } from "react";

import {
  faBan,
  faCheck,
  faEllipsis,
  faPenToSquare,
  faThumbsUp,
  faTrashCan,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import moment from "moment";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TextareaAutosize from "react-textarea-autosize";
import styled from "styled-components";

import { useWuphfUser } from "../../hooks/WuphfUserContext";
import Avatar from "../general/Avatar";
import Button from "../general/Button";

function Wuphf(props) {
  const { lastWuphfElementRef, deleteWuphf } = props;

  const [editMenuShown, setEditMenuShown] = useState(false);
  const [editable, setEditable] = useState(false);
  const [postContent, setPostContent] = useState(props.postBody);

  const [userLikePost, setUserLikePost] = useState(props.userLikePost);
  const [likeCount, setLikeCount] = useState(props._count?.Likes);
  const { wuphfUser } = useWuphfUser();

  const { data: session } = useSession();
  function toggleEditMenuShown(e) {
    e.preventDefault();
    setEditMenuShown(!editMenuShown);
  }

  function toggleEditable(e) {
    e.preventDefault();
    setEditMenuShown(false);
    setEditable(!editable);
  }

  function handleEdit(e) {
    if (editable) {
      setPostContent(e.target.value);
    }
  }

  function handleDelete(e) {
    e.preventDefault();
    setEditMenuShown(false);
    axios.delete(`/api/wuphfs/${props.id}`).then(() => {
      props.deleteWuphf(props.id);
    });
  }

  function handleSave(e) {
    e.preventDefault();
    setEditable(false);
    axios.patch(`/api/wuphfs/${props.id}`, {
      postBody: postContent,
    });
  }

  function handleChild(e) {
    // prevent a click on textbox from triggering link on parent
    e.stopPropagation();
  }
  async function handleLikeToggle() {
    if (!userLikePost) {
      axios
        .post(`/api/wuphfs/${props.id}/likes`, {
          userId: session.user.email,
          wuphfId: props.id,
        })
        .then(() => {
          setUserLikePost(true);
          setLikeCount(likeCount + 1);
        });
    } else {
      await axios
        .delete(`/api/wuphfs/${props.id}/likes`, {
          userId: session.user.email,
          wuphfId: props.id,
        })
        .then(() => {
          setUserLikePost(false);
          setLikeCount(likeCount - 1);
        });
    }
  }

  function formatTime(createdAt) {
    // moment.locale('en', {
    // 	relativeTime: {
    // 		future: 'in %s',
    // 		past: '%s ago',
    // 		s: 'seconds ago',
    // 		ss: '%ss',
    // 		m: 'minutes ago',
    // 		mm: '%dm',
    // 		h: 'hours ago',
    // 		hh: '%dh',
    // 		d: 'days ago',
    // 		dd: '%dd',
    // 		M: 'months ago',
    // 		MM: '%dM',
    // 		y: 'years ago',
    // 		yy: '%dY',
    // 	},
    // })
    const currentTime = moment();
    const wuphfTime = moment(createdAt);

    const timeDiff = currentTime.diff(wuphfTime, "h");

    if (timeDiff < 24) {
      return moment(createdAt).fromNow();
    } else {
      return moment(createdAt).format("MMM Do");
    }
  }

  return (
    <PostBorder ref={lastWuphfElementRef}>
      <Container>
        <AvatarWrapper>
          {props.user && (
            <Link href={`/user/${props.userId}`}>
              <Avatar
                username={props.userId}
                profileImageUrl={props.user.avatar.url}
                size="large"
              />
            </Link>
          )}
        </AvatarWrapper>
        <PostWrapper>
          <TweetHeader>
            <UsernameAndTime>
              <Link href={`/user/${props.userId}`}>
                <Username as="h3">{props.userId}</Username>
              </Link>
              <Dot>·</Dot>
              {/* <Time>{moment(props?.createdAt).format('MMM Do')}</Time> */}
              <Time>{formatTime(props?.createdAt)}</Time>
            </UsernameAndTime>
            {wuphfUser?.userName === props.userId && (
              <EditCorner>
                <StyledEditButton
                  icon={faEllipsis}
                  onClick={toggleEditMenuShown}
                  $shown={editMenuShown}
                />
                <EditMenu $shown={editMenuShown}>
                  {!editable && (
                    <EditMenuItem onClick={toggleEditable}>
                      <FontAwesomeIcon icon={faPenToSquare} />
                      <span>Edit</span>
                    </EditMenuItem>
                  )}
                  {editable && (
                    <EditMenuItem onClick={toggleEditable}>
                      <FontAwesomeIcon icon={faBan} />
                      <span>Cancel</span>
                    </EditMenuItem>
                  )}
                  <EditMenuItem onClick={handleDelete}>
                    <FontAwesomeIcon icon={faTrashCan} />
                    <span>Delete</span>
                  </EditMenuItem>
                </EditMenu>
              </EditCorner>
            )}
          </TweetHeader>
          <SecondRow>
            <Post
              value={postContent}
              onChange={handleEdit}
              $editable={editable}
              onClick={handleChild}
            />
            <SaveButton
              $shown={editable}
              variant="secondary"
              onClick={handleSave}
            >
              <span>Save changes</span>
              <FontAwesomeIcon icon={faCheck} />
            </SaveButton>
          </SecondRow>
          <Reactions>
            <LikeWrapper userLikePost={userLikePost}>
              <FontAwesomeIcon
                icon={faThumbsUp}
                onClick={handleLikeToggle}
                style={{ cursor: "pointer" }}
              />
              <LikeCount>{likeCount}</LikeCount>
            </LikeWrapper>
            <Link href={`/wuphf/${props.id}`}>
              <CommentWrapper hasComments={props._count.Comments > 0}>
                <FontAwesomeIcon
                  icon={faComment}
                  style={{ cursor: "pointer" }}
                />
                <CommentCount>{props._count.Comments}</CommentCount>
              </CommentWrapper>
            </Link>
          </Reactions>
        </PostWrapper>
      </Container>
    </PostBorder>
  );
}

const LikeCount = styled.span`
  cursor: pointer;
`;

const CommentCount = styled.span`
  cursor: pointer;
`;

const Reactions = styled.div`
  display: flex;
  gap: 1rem;
`;

const CommentWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  color: ${({ hasComments, theme }) =>
    hasComments ? theme.colors.comment : "grey"};
  svg {
    padding: 0.4rem;
    border-radius: 50%;
    transition: 0.15s ease-in-out;
    &:hover {
      background-color: ${({ theme }) => theme.colors.commentHover};
      color: ${({ theme }) => theme.colors.comment};
    }
    &:active {
      background-color: ${({ theme }) => theme.colors.commentActive};
    }
  }
`;
const LikeWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  color: ${({ userLikePost, theme }) =>
    userLikePost ? theme.colors.like : "grey"};
  svg {
    padding: 0.4rem;
    border-radius: 50%;
    transition: 0.15s ease-in-out;
    &:hover {
      background-color: ${({ theme }) => theme.colors.likeHover};
      color: ${({ theme }) => theme.colors.like};
    }
    &:active {
      background-color: ${({ theme }) => theme.colors.likeActive};
    }
  }
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: 5rem auto;
  width: 100%;
`;

const TweetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EditCorner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  cursor: pointer;
`;

const StyledEditButton = styled(FontAwesomeIcon)`
  padding: 5px;
  border-radius: 50%;
  color: ${(props) => props.theme.colors.lightGrey};
  background-color: ${(props) =>
    props.$shown ? props.theme.colors.primary : "auto"};
  &:hover {
    background-color: ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.text};
  }
`;

const EditMenu = styled.ul`
  background-color: ${(props) => props.theme.colors.highlight};
  position: absolute;
  margin-top: 25px;
  border-radius: 10px;
  height: ${(props) => (props.$shown ? "auto" : "0px")};
  display: ${(props) => (props.$shown ? "block" : "none")};
`;

const EditMenuItem = styled.li`
  padding: 5px 10px;
  display: flex;
  gap: 5px;
  cursor: pointer;

  :first-of-type {
    border-radius: 10px 10px 0 0;
  }

  :last-of-type {
    border-radius: 0 0 10px 10px;
  }

  &:hover {
    color: ${(props) => props.theme.colors.text};
    background-color: ${(props) => props.theme.colors.primary};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  padding: 1rem;
  span {
    width: 50px;
    height: 50px;
  }
  margin: 0 auto;
`;

const PostWrapper = styled.div`
  padding: 1rem;
  padding-left: 0;
`;

const UsernameAndTime = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const Dot = styled.span`
  color: ${({ theme }) => theme.colors.subtext};
`;

const Time = styled.span`
  color: ${({ theme }) => theme.colors.subtext};
`;

const Username = styled.h3`
  position: relative;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;

const Post = styled(TextareaAutosize)`
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  padding: 5px 0;
  line-height: 1.25em;
  background: rgba(0, 0, 0, 0);
  border: ${(props) =>
    props.$editable ? `1px solid ${props.theme.colors.darkestBlue}` : "none"};
  border-radius: 10px;
  cursor: ${(props) => (props.$editable ? "text" : "default")};
  resize: none;
  width: 100%;
  height: 100%;
  box-shadow: none;
  outline: none;
`;

const PostBorder = styled.div`
  &:first-child {
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
  }

  &:last-child {
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
  }

  &:not(:last-child) {
    border-bottom: 1.5px solid ${(props) => props.theme.colors.border};
  }

  &:hover {
    background-color: ${(props) => props.theme.colors.highlight};
  }

  /* cursor: pointer; */
`;

const SaveButton = styled(Button)`
  display: ${(props) => (props.$shown ? "flex" : "none")};
  justify-content: flex-end;
  gap: 10px;
  width: max-content;
`;

const SecondRow = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 5px;
`;

export default Wuphf;
