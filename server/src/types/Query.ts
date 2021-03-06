import { permissions } from '../permissions'
import { APP_SECRET, getUserId } from '../utils'
import { compare, hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { applyMiddleware } from 'graphql-middleware'
import {
  intArg,
  makeSchema,
  nonNull,
  objectType,
  stringArg,
  inputObjectType,
  arg,
  asNexusMethod,
  enumType,
} from 'nexus'
import { DateTimeResolver } from 'graphql-scalars'
import { Context } from '../context'


export const Query = objectType({
    name: 'Query',
    definition(t) {

      //FInd all user in the sysytem
      t.nonNull.list.nonNull.field('allUsers', {
        type: 'User',
        resolve: (_parent, _args, context: Context) => {
          return context.prisma.user.findMany()
        },
      })
      
      //Find a Number by user id
      t.nullable.field('me', {
        type: 'User',
        resolve: (parent, args, context: Context) => {
          const userId = getUserId(context)
          return context.prisma.user.findUnique({
            where: {
              id: Number(userId),
            },
          })
        },
      })
  
      t.nullable.field('postById', {
        type: 'Post',
        args: {
          id: intArg(),
        },
        resolve: (_parent, args, context: Context) => {
          return context.prisma.post.findUnique({
            where: { id: args.id || undefined },
          })
        },
      })
  
      t.nonNull.list.nonNull.field('feed', {
        type: 'Post',
        args: {
          searchString: stringArg(),
          skip: intArg(),
          take: intArg(),
          orderBy: arg({
            type: 'PostOrderByUpdatedAtInput',
          }),
        },
        resolve: (_parent, args, context: Context) => {
          const or = args.searchString
            ? {
                OR: [
                  { title: { contains: args.searchString } },
                  { content: { contains: args.searchString } },
                ],
              }
            : {}
  
          return context.prisma.post.findMany({
            where: {
              published: true,
              ...or,
            },
            take: args.take || undefined,
            skip: args.skip || undefined,
            orderBy: args.orderBy || undefined,
          })
        },
      })
  
      t.list.field('draftsByUser', {
        type: 'Post',
        args: {
          userUniqueInput: nonNull(
            arg({
              type: 'UserUniqueInput',
            }),
          ),
        },
        resolve: (_parent, args, context: Context) => {
          return context.prisma.user
            .findUnique({
              where: {
                id: args.userUniqueInput.id || undefined,
                email: args.userUniqueInput.email || undefined,
              },
            })
            .posts({
              where: {
                published: false,
              },
            })
        },
      })
    },
  })