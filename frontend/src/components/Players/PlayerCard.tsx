import {
  Badge,
  Box,
  chakra,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react"

import type { PlayerPublic } from "@/client"

import { PlayerActionsMenu } from "./PlayerActionsMenu"

interface PlayerCardProps {
  player: PlayerPublic
  divisionName?: string
  groupName?: string
}

const PlayerCard = ({ player, divisionName, groupName }: PlayerCardProps) => {
  const fallbackInitial = player.full_name.charAt(0)

  const PlayerImage = chakra("img")

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      display="flex"
      flexDirection="column"
      gap={4}
    >
      <Flex justifyContent="space-between" alignItems="flex-start" gap={4}>
        <Flex alignItems="center" gap={4}>
          {player.photo_url ? (
            <PlayerImage
              src={player.photo_url}
              alt={`${player.full_name} avatar`}
              borderRadius="full"
              boxSize="14"
              objectFit="cover"
            />
          ) : (
            <Flex
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              boxSize="14"
              bg="gray.200"
              fontWeight="bold"
            >
              {fallbackInitial}
            </Flex>
          )}
          <Stack gap={0}>
            <Heading size="md">{player.full_name}</Heading>
            <Badge colorPalette="blue" width="fit-content">
              Rating: {player.rating ?? 0}
            </Badge>
          </Stack>
        </Flex>
        <PlayerActionsMenu player={player} />
      </Flex>

      <Stack gap={1} fontSize="sm">
        <Text>
          <Text as="span" fontWeight="semibold">
            Division:
          </Text>{" "}
          {divisionName ?? "N/A"}
        </Text>
        <Text>
          <Text as="span" fontWeight="semibold">
            Group:
          </Text>{" "}
          {groupName ?? "N/A"}
        </Text>
      </Stack>
    </Box>
  )
}

export default PlayerCard
