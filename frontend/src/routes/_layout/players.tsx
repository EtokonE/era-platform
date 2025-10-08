import {
  Container,
  EmptyState,
  Heading,
  SimpleGrid,
  Spinner,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { FiUsers } from "react-icons/fi"

import {
  type DivisionPublic as Division,
  type DivisionGroupPublic as DivisionGroup,
  DivisionsService,
  PlayersService,
} from "@/client"
import AddPlayer from "@/components/Players/AddPlayer"
import PlayerCard from "@/components/Players/PlayerCard"
import { useDivisions } from "@/hooks/useDivisions"

export const Route = createFileRoute("/_layout/players")({
  component: Players,
})

const getDivisionGroupsQuery = (divisionIds: string[]) => ({
  queryKey: ["division-groups", { divisionIds }],
  queryFn: async () => {
    const responses = await Promise.all(
      divisionIds.map((divisionId) =>
        DivisionsService.listDivisionGroups({ divisionId }),
      ),
    )
    return responses.flat()
  },
  enabled: divisionIds.length > 0,
})

function Players() {
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ["players"],
    queryFn: () => PlayersService.listPlayers(),
  })

  const players = playersData?.data ?? []

  const { data: divisionsData, isLoading: divisionsLoading } = useDivisions()

  const divisionMap = useMemo(() => {
    const map = new Map<string, Division>()
    divisionsData?.forEach((division) => {
      map.set(division.id, division)
    })
    return map
  }, [divisionsData])

  const divisionIds = useMemo(() => {
    return Array.from(
      new Set(players.map((player) => player.division_id)),
    ).sort()
  }, [players])

  const { data: groupsData, isLoading: groupsLoading } = useQuery<
    DivisionGroup[]
  >({
    ...getDivisionGroupsQuery(divisionIds),
  })

  const groupMap = useMemo(() => {
    const map = new Map<string, DivisionGroup>()
    groupsData?.forEach((group) => {
      map.set(group.id, group)
    })
    return map
  }, [groupsData])

  if (playersLoading || divisionsLoading || groupsLoading) {
    return (
      <Container maxW="full" py={12} display="flex" justifyContent="center">
        <Spinner size="xl" />
      </Container>
    )
  }

  if (players.length === 0) {
    return (
      <Container maxW="full" py={12}>
        <Heading size="lg" mb={6}>
          Players
        </Heading>
        <AddPlayer />
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiUsers />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>No players yet</EmptyState.Title>
              <EmptyState.Description>
                Add a new player to get started.
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </Container>
    )
  }

  return (
    <Container maxW="full" py={12}>
      <Heading size="lg" mb={6}>
        Players
      </Heading>
      <AddPlayer />
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            divisionName={divisionMap.get(player.division_id)?.name}
            groupName={
              player.group_id ? groupMap.get(player.group_id)?.name : undefined
            }
          />
        ))}
      </SimpleGrid>
    </Container>
  )
}

export default Players
