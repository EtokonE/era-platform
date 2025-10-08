import {
  Avatar,
  Badge,
  Box,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react"

import type { PlayerPublic } from "@/client"
import type { Division, DivisionGroup } from "@/client/players-extra"

import PlayerActionsMenu from "./PlayerActionsMenu"

interface PlayerCardProps {
  player: PlayerPublic
  division?: Division
  group?: DivisionGroup
  canManage: boolean
  divisions: Division[]
  divisionGroups: DivisionGroup[]
  isRefreshing?: boolean
}

const PlayerCard = ({
  player,
  division,
  group,
  canManage,
  divisions,
  divisionGroups,
  isRefreshing,
}: PlayerCardProps) => {
  return (
    <Box
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border"
      bg="bg.surface"
      p={6}
      position="relative"
      transition="all 0.2s ease"
      _hover={{ shadow: "md", borderColor: "primary.500" }}
    >
      {canManage ? (
        <Box position="absolute" top={2} right={2}>
          <PlayerActionsMenu
            player={player}
            divisions={divisions}
            divisionGroups={divisionGroups}
            isDisabled={isRefreshing}
          />
        </Box>
      ) : null}
      <Flex direction="column" alignItems="center" gap={4} textAlign="center">
        <Avatar.Root size="xl" shadow="sm">
          <Avatar.Image
            src={player.photo_url ?? undefined}
            alt={player.full_name}
          />
          <Avatar.Fallback name={player.full_name} />
        </Avatar.Root>
        <Heading size="md">{player.full_name}</Heading>
        <Badge colorPalette="purple" px={3} py={1} borderRadius="lg">
          Rating: {player.rating ?? "N/A"}
        </Badge>
        <Stack gap={3} w="full">
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Division
            </Text>
            <Text fontWeight="medium">
              {division?.name ?? player.division_id}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Group
            </Text>
            <Text fontWeight="medium">{group?.name ?? "No group"}</Text>
          </Box>
        </Stack>
      </Flex>
    </Box>
  )
}

export default PlayerCard
